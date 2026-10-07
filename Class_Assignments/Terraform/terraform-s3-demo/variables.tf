variable "aws_region" {
  type        = string
  description = "AWS region for the bucket."
  default     = "ap-south-1"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique S3 bucket name."

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "Bucket names must be 3-63 characters: lowercase letters, numbers, dots and hyphens."
  }
}

variable "environment" {
  type        = string
  description = "Environment tag (dev, staging, prod)."
  default     = "dev"
}

variable "enable_versioning" {
  type        = bool
  description = "Keep every version of every object."
  default     = true
}

variable "use_localstack" {
  type        = bool
  description = "Send AWS API calls to LocalStack instead of real AWS."
  default     = true
}

variable "localstack_endpoint" {
  type        = string
  description = "LocalStack edge endpoint."
  default     = "http://localhost:4566"
}
