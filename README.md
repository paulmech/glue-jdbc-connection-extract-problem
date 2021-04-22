# Why does GlueContext modify the URL of a Glue Connection (JDBC)?

## Context

When a Glue Connection is created - specifically a JDBC type - users can specify

- URL
- Username
- Password

In my example, the url is as follows:

> jdbc:oracle:thin://@hostname.rds.amazonaws.com:1521/ORCL

This is fairly typical for a `connection_type = oracle` Glue Connection.

## Problem

When authoring spark jobs that intend to **write to a JDBC destination**, it seems to make sense to attempt the use of the Glue Connection to set up a writer.

The [documentation for the GlueContext class](https://docs.aws.amazon.com/glue/latest/dg/aws-glue-api-crawler-pyspark-extensions-glue-context.html#aws-glue-api-crawler-pyspark-extensions-glue-context-extract_jdbc_conf) has two methods which indicate doing so should be possible:

- write_from_jdbc_conf
- extract_jdbc_conf

The problem experienced in both of these methods, is that the Glue Connection URL is modified by these methods:

> jdbc:oracle:thin://@hostname.rds.amazonaws.com:1521/ORCL

loses the `thin` part to become

> jdbc:oracle://@hostname.rds.amazonaws.com:1521/ORCL

It's not clear why this happens and it causes problems when trying to write a dynamic frame in Glue Jobs.

## Reproduce

Use the cdk project within this repository to deploy

- A standalone VPC
- The sample Glue Connection
- A Development Endpoint

Once the project is running, go to the AWS Glue Console and create a new Sagemaker Notebook, connected to the Development Endpoint.

From there, you can run the `ipynb` file in the `documents/` folder. Or you can simply view the screenshot in there, also.
