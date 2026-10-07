variable "aws_region" {
  type        = string
  description = "AWS region to build in."
  default     = "ap-south-1"
}

variable "project" {
  type        = string
  description = "Name prefix for every resource."
  default     = "s19-webapp"
}

variable "vpc_cidr" {
  type        = string
  description = "Address range of the whole VPC."
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "Address range of the public subnet (must be inside vpc_cidr)."
  default     = "10.20.1.0/24"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance size."
  default     = "t3.micro"
}

variable "ssh_allowed_cidr" {
  type        = string
  description = "Only this address range may SSH to the instance."
  default     = "203.0.113.10/32"
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
