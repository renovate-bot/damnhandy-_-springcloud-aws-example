import * as cdk from "@aws-cdk/core";
import { RemovalPolicy } from "@aws-cdk/core";
import * as ecr from "@aws-cdk/aws-ecr";
import * as ecr_assets from "@aws-cdk/aws-ecr-assets";
import { VpcStack } from "./vpc-stack";
import { FoundationStack } from "./foundation-stack";
import { Protocol } from "@aws-cdk/aws-elasticloadbalancingv2";
import { DatabaseStack } from "./database-stack";
import ecs = require("@aws-cdk/aws-ecs");
import ecs_patterns = require("@aws-cdk/aws-ecs-patterns");

/**
 *
 */
export interface ApplicationStackProps extends cdk.StackProps {
  readonly vpcStack: VpcStack;
  readonly foundationStack: FoundationStack;
  readonly databaseStack: DatabaseStack;
  readonly appName: string;
}

/**
 *
 */
export class ApplicationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    const ecrRepo = new ecr.Repository(this, "ECRRepo", {
      repositoryName: `apps/${props.appName}`,
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.SNAPSHOT
    });

    const cluster = new ecs.Cluster(this, "DemoCluster", {
      vpc: props.vpcStack.vpc,
      containerInsights: true
    });

    const container = new ecr_assets.DockerImageAsset(this, "DemoAppContainerAsset", {
      directory: "springboot-app",
      target: `apps/${props.appName}`
    });

    // Create a load-balanced Fargate service and make it public
    const ecsService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "DemoApplication", {
      serviceName: props.appName,
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(container.repository),
        containerPort: 8080,
        environment: {
          SPRING_PROFILES_ACTIVE: "aws",
          JAVA_TOOL_OPTIONS: "-XX:InitialRAMPercentage=70 -XX:MaxRAMPercentage=70 -Dfile.encoding=UTF-8"
        }
      },
      memoryLimitMiB: 1024,
      publicLoadBalancer: true,
      listenerPort: 8080
    });



    ecsService.targetGroup.configureHealthCheck({
      path: "/actuator/health/liveness",
      port: "8081",
      protocol: Protocol.HTTP,
      healthyHttpCodes: "200"
    });

    container.repository.grantPull(ecsService.taskDefinition.taskRole);
    props.foundationStack.kmsKey.grantDecrypt(ecsService.service.taskDefinition.taskRole);
    props.databaseStack.mysql_cluster.connections.allowDefaultPortTo(ecsService.service, "ECS Service to DB");
  }
}
