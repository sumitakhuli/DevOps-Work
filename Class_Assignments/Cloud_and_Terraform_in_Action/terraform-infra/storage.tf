# ---------- S3: static assets the web server serves ----------
resource "aws_s3_bucket" "assets" {
  bucket        = "${var.project}-assets-24bcs10158"
  force_destroy = true

  tags = { Name = "${var.project}-assets" }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.assets.id
  key          = "index.html"
  content      = "<h1>Session 19 - deployed by Terraform</h1>\n"
  content_type = "text/html"
}
