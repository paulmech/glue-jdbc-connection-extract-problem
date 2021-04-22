import * as cdk from "@aws-cdk/core";
import * as iam from "@aws-cdk/aws-iam";
import {
  Vpc,
  SubnetType,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
  SecurityGroup,
  Port,
} from "@aws-cdk/aws-ec2";
import * as glue from "@aws-cdk/aws-glue";
import { ConnectionType } from "@aws-cdk/aws-glue";

export class GlueBadJdbcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "bad-jdbc-vpc", {
      cidr: "192.168.4.0/23",
      maxAzs: 1,
      subnetConfiguration: [
        {
          name: "glue",
          subnetType: SubnetType.ISOLATED,
          cidrMask: 26,
        },
        {
          name: "public",
          subnetType: SubnetType.PUBLIC,
          cidrMask: 26,
        },
      ],
      natGateways: 0,
    });

    // add s3 gateway endpoint
    vpc.addGatewayEndpoint("s3-endpoint", {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: SubnetType.ISOLATED,
        },
      ],
    });

    // add glue interface endpoint
    vpc.addInterfaceEndpoint("glue endpoint", {
      service: InterfaceVpcEndpointAwsService.GLUE,
      subnets: {
        subnetType: SubnetType.ISOLATED,
      },
    });

    // create a self referential security group because glue
    const glueSecurityGroup = new SecurityGroup(this, "glue-sg", {
      description: "glue self referential allow in out",
      vpc,
    });
    glueSecurityGroup.connections.allowFrom(glueSecurityGroup, Port.allTcp());
    glueSecurityGroup.connections.allowTo(glueSecurityGroup, Port.allTcp());

    // The code that defines your stack goes here
    const glueConnect = new glue.Connection(this, "glue-connection", {
      type: ConnectionType.JDBC,
      connectionName: "bad-jdbc",
      description: "part of a support case, please do not delete",
      subnet: vpc.isolatedSubnets[0],
      securityGroups: [glueSecurityGroup],
      properties: {
        JDBC_CONNECTION_URL:
          "jdbc:oracle:thin://@hostname.rds.amazonaws.com:1521/ORCL",
        USERNAME: "",
        PASSWORD: "",
      },
    });

    const glueRole = new iam.Role(this, "glue-role", {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
    });
    const glueManagedPolicy = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      "glue-managed-policy",
      "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
    );
    glueRole.addManagedPolicy(glueManagedPolicy);

    const devEndpoint = new glue.CfnDevEndpoint(this, "dev-endpoint", {
      roleArn: glueRole.roleArn,
      endpointName: "bad-jdbc-dev-endpoint",
      workerType: "Standard",
      glueVersion: "1.0",
      arguments: {
        GLUE_PYTHON_VERSION: "3",
      },
      numberOfWorkers: 2,
      securityGroupIds: [glueSecurityGroup.securityGroupId],
      subnetId: vpc.isolatedSubnets[0].subnetId,
    });
  }
}
