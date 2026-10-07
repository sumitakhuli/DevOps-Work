terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# When use_localstack = true every AWS call goes to LocalStack (a local AWS emulator
# running in Docker on port 4566) with dummy credentials. Set it to false to use real AWS
# with the credentials from `aws configure`.
provider "aws" {
  region = var.aws_region

  access_key                  = var.use_localstack ? "test" : null
  secret_key                  = var.use_localstack ? "test" : null
  skip_credentials_validation = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  s3_use_path_style           = var.use_localstack

  endpoints {
    s3  = var.use_localstack ? var.localstack_endpoint : null
    sts = var.use_localstack ? var.localstack_endpoint : null
  }

  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Project   = "Session18"
      Owner     = "Sumit Akhuli"
    }
  }
}
