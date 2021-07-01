# Spring Boot with Spring Cloud AWS Example

This is a small sample application that uses a SpringBoot service with Spring Cloud AWS to source certain configuration elements. Additionally, it uses the AWS Cloud Development Kit (CDK) to provision the AWS resources that the application needs in order to deploy into AWS.

## Provisioning Secrets for local development.

A key element of this project is to promote proper credential handling. As such, the project attempts to simulate a hands-off credentials management approach. In a local environment, the DB credentials are are generated and stored in the `./credentials` directory. When running under Docker Compose, these values are injected into the environment via the Docker Secrets mechanism. When deployed in AWS, the DB credentials are generated by AWS Secrets Manager and referenced in the application via Spring Cloud AWS.

Prior to running the application in either local model, run the `prepare_credentials.sh` script. This will generated the following:

- The MySQL root password
- The MySQL appuser password (used by the SpringBoot application)
- The MySQL certificates
- A Java KeyStore that contains the self-signed MySQL root CA

Practically ALL SpringBoot/MySQL examples end up creating a JDBC connection with `sslMode=DISABLED` as it's generally easier. Because these types of examples end up making their way into production, this project demonstrates how to use TLS with MySQL.

In order to do this, we generate the MySQL certificates first so we can create a KeyStore with the generated root certificates.

## Local Hybrid Deployment with Docker Compose

In this model, we use Docker Compose to bring up ONLY the MySQL DB so that we can run the SpringBoot application via an IDE on the Host OS. In order to do this, run the following:

    $ ./prepare_credentials.sh
    $ docker compose up mysql

More details TBD.

## Local Deployment with Docker Compose

To run the stack locally, simply run the following commands:

    $ ./prepare_credentials.sh
    $ docker compose build
    $ docker compose up

This will build the container with the SpringBoot application and then launch the MySQL database and SpringBoot application.

## AWS CDK Deployment

TBD

## Useful CDK commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template