output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet."
  value       = aws_subnet.public.id
}

output "availability_zone" {
  description = "AZ the subnet and instance are in."
  value       = aws_subnet.public.availability_zone
}

output "security_group_id" {
  description = "ID of the web security group."
  value       = aws_security_group.web.id
}

output "ami_used" {
  description = "AMI chosen by the data source."
  value       = "${data.aws_ami.ubuntu.id} (${data.aws_ami.ubuntu.name})"
}

output "instance_id" {
  description = "ID of the EC2 instance."
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "Public IP of the web server."
  value       = aws_instance.web.public_ip
}

output "instance_private_ip" {
  description = "Private IP of the web server inside the VPC."
  value       = aws_instance.web.private_ip
}

output "assets_bucket" {
  description = "Name of the S3 assets bucket."
  value       = aws_s3_bucket.assets.bucket
}
