terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "gcp_project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "gcp_region" {
  type        = string
  default     = "europe-central2" # Low latency to Central Europe
  description = "GCP Region for cloud resources"
}

variable "vps_ipv4" {
  type        = string
  description = "Public IPv4 of the Hostinger VPS"
  default     = ""
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# 1. GCS Bucket for Hydralisk Static Bundle, Presets, and .mp4 Videos
resource "google_storage_bucket" "hydralisk_static" {
  name                        = "hydralisk-assets-${var.gcp_project_id}"
  location                    = "EU"
  uniform_bucket_level_access = true
  force_destroy               = true

  cors {
    origin          = ["https://hydralisk.sphynx.cloud"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
}

# Make static assets publicly readable via CDN
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.hydralisk_static.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# 2. Cloud CDN Backend Bucket
resource "google_compute_backend_bucket" "cdn_backend" {
  name        = "hydralisk-cdn-backend"
  bucket_name = google_storage_bucket.hydralisk_static.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 86400
    max_ttl           = 604800
    client_ttl        = 86400
    negative_caching  = true
    serve_while_stale = 86400
  }
}

output "cdn_bucket_url" {
  value       = "https://storage.googleapis.com/${google_storage_bucket.hydralisk_static.name}"
  description = "Origin URL for static assets or Caddy upstream proxy"
}
