use std::{env, time::Duration};

use actix_files::Files;
use actix_web::{
    get,
    http::header,
    middleware::Logger,
    web::{self, Data, Path, Query},
    App, HttpResponse, HttpServer, Responder,
};
use anyhow::{Context, Result};
use aws_credential_types::Credentials;
use aws_sdk_s3::{presigning::PresigningConfig, types::CommonPrefix, Client};
use aws_types::region::Region;
use serde::{Deserialize, Serialize};
use tracing_subscriber::EnvFilter;

#[derive(Clone)]
struct AppState {
    s3: Client,
    bucket: String,
}

#[derive(Debug, Clone)]
struct AppConfig {
    port: u16,
    static_dir: String,
    aws_region: String,
    aws_access_key_id: String,
    aws_secret_access_key: String,
    aws_s3_endpoint_url: Option<String>,
    aws_s3_bucket_name: String,
    aws_s3_force_path_style: bool,
}

#[derive(Deserialize)]
#[allow(non_snake_case)]
struct ListQuery {
    page: Option<usize>,
    pageSize: Option<usize>,
    prefix: Option<String>,
}

#[derive(Clone, Serialize)]
struct VideoItem {
    key: String,
    size: i64,
    #[serde(rename = "lastModified")]
    last_modified: Option<String>,
    #[serde(rename = "streamUrl")]
    stream_url: String,
}

#[derive(Serialize)]
struct Pagination {
    page: usize,
    #[serde(rename = "pageSize")]
    page_size: usize,
    #[serde(rename = "totalPages")]
    total_pages: usize,
    #[serde(rename = "totalVideos")]
    total_videos: usize,
    #[serde(rename = "hasNextPage")]
    has_next_page: bool,
    #[serde(rename = "hasPrevPage")]
    has_prev_page: bool,
}

#[derive(Serialize)]
struct ListResponse {
    prefix: String,
    folders: Vec<String>,
    videos: Vec<VideoItem>,
    pagination: Pagination,
}

fn parse_bool_env(value: Option<String>) -> bool {
    matches!(
        value
            .unwrap_or_default()
            .to_lowercase()
            .as_str(),
        "1" | "true" | "yes" | "on"
    )
}

fn load_config() -> Result<AppConfig> {
    let port = env::var("PORT")
        .ok()
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(3000);

    let static_dir = env::var("STATIC_DIR").unwrap_or_else(|_| "static".to_string());

    let aws_region = env::var("AWS_REGION").context("Missing AWS_REGION")?;
    let aws_access_key_id = env::var("AWS_ACCESS_KEY_ID").context("Missing AWS_ACCESS_KEY_ID")?;
    let aws_secret_access_key =
        env::var("AWS_SECRET_ACCESS_KEY").context("Missing AWS_SECRET_ACCESS_KEY")?;
    let aws_s3_endpoint_url = env::var("AWS_S3_ENDPOINT_URL").ok();
    let aws_s3_bucket_name = env::var("AWS_S3_BUCKET_NAME").context("Missing AWS_S3_BUCKET_NAME")?;
    let aws_s3_force_path_style = parse_bool_env(env::var("AWS_S3_FORCE_PATH_STYLE").ok());

    Ok(AppConfig {
        port,
        static_dir,
        aws_region,
        aws_access_key_id,
        aws_secret_access_key,
        aws_s3_endpoint_url,
        aws_s3_bucket_name,
        aws_s3_force_path_style,
    })
}

async fn build_s3_client(config: &AppConfig) -> Result<Client> {
    let region_provider = Region::new(config.aws_region.clone());
    let credentials = Credentials::new(
        &config.aws_access_key_id,
        &config.aws_secret_access_key,
        None,
        None,
        "env",
    );

    let mut loader = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .region(region_provider)
        .credentials_provider(credentials);

    if let Some(endpoint_url) = &config.aws_s3_endpoint_url {
        loader = loader.endpoint_url(endpoint_url);
    }

    let shared_config = loader.load().await;
    let mut s3_config_builder = aws_sdk_s3::config::Builder::from(&shared_config);
    if config.aws_s3_force_path_style {
        s3_config_builder = s3_config_builder.force_path_style(true);
    }
    let s3_config = s3_config_builder.build();

    Ok(Client::from_conf(s3_config))
}

fn common_prefix_to_string(prefix: &CommonPrefix) -> Option<String> {
    prefix.prefix().map(|p| p.to_string())
}

#[get("/videos")]
async fn list_videos(state: Data<AppState>, query: Query<ListQuery>) -> actix_web::Result<impl Responder> {
    let page = query.page.unwrap_or(1);
    let mut page_size = query.pageSize.unwrap_or(18);
    if page_size == 0 {
        page_size = 18;
    }
    let prefix = query.prefix.clone().unwrap_or_default();

    let response = state
        .s3
        .list_objects_v2()
        .bucket(&state.bucket)
        .prefix(&prefix)
        .delimiter("/")
        .max_keys(1000)
        .send()
        .await
        .map_err(|err| {
            actix_web::error::ErrorInternalServerError(format!(
                "Failed to list videos: {err}"
            ))
        })?;

    let contents = response.contents();
    let common_prefixes = response.common_prefixes();

    let video_extensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"];

    let mut videos: Vec<VideoItem> = contents
        .iter()
        .filter_map(|item: &aws_sdk_s3::types::Object| {
            let key = item.key()?.to_string();
            let lower = key.to_lowercase();
            if !video_extensions.iter().any(|ext| lower.ends_with(ext)) {
                return None;
            }
            let size = item.size().unwrap_or(0);
            let last_modified = item.last_modified().map(|dt| dt.to_string());
            let stream_url = format!(
                "/api/videos/stream/{}",
                urlencoding::encode(&key)
            );
            Some(VideoItem {
                key,
                size,
                last_modified,
                stream_url,
            })
        })
        .collect();

    videos.sort_by(|a, b| a.key.cmp(&b.key));

    let folders: Vec<String> = common_prefixes
        .iter()
        .filter_map(common_prefix_to_string)
        .collect();

    let total_videos = videos.len();
    let total_pages = (total_videos + page_size - 1) / page_size;
    let start_index = page.saturating_sub(1) * page_size;
    let end_index = std::cmp::min(start_index + page_size, total_videos);
    let paginated_videos = if start_index >= total_videos {
        vec![]
    } else {
        videos[start_index..end_index].to_vec()
    };

    let pagination = Pagination {
        page,
        page_size,
        total_pages,
        total_videos,
        has_next_page: page < total_pages,
        has_prev_page: page > 1,
    };

    Ok(HttpResponse::Ok().json(ListResponse {
        prefix,
        folders,
        videos: paginated_videos,
        pagination,
    }))
}

#[get("/videos/stream/{key:.*}")]
async fn stream_video(state: Data<AppState>, path: Path<String>) -> actix_web::Result<HttpResponse> {
    let raw_key = path.into_inner();
    let decoded_key = urlencoding::decode(&raw_key)
        .map_err(|_| actix_web::error::ErrorBadRequest("Invalid key encoding"))?;

    let presign_config = PresigningConfig::expires_in(Duration::from_secs(3600))
        .map_err(|err| actix_web::error::ErrorInternalServerError(err))?;

    let presigned = state
        .s3
        .get_object()
        .bucket(&state.bucket)
        .key(decoded_key.as_ref())
        .presigned(presign_config)
        .await
        .map_err(|err| {
            actix_web::error::ErrorInternalServerError(format!(
                "Failed to presign URL: {err}"
            ))
        })?;

    Ok(HttpResponse::Found()
        .append_header((header::LOCATION, presigned.uri().to_string()))
        .finish())
}

#[actix_web::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let config = load_config()?;

    let s3_client = build_s3_client(&config).await?;
    let state = Data::new(AppState {
        s3: s3_client,
        bucket: config.aws_s3_bucket_name.clone(),
    });

    let bind_addr = format!("0.0.0.0:{}", config.port);

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .wrap(Logger::default())
            .service(
                web::scope("/api")
                    .service(list_videos)
                    .service(stream_video),
            )
            .service(Files::new("/", &config.static_dir).index_file("index.html"))
    })
    .bind(bind_addr)?
    .run()
    .await?;

    Ok(())
}
