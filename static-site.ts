#!/usr/bin/env node
//@ts-nocheck
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class StaticSite extends Construct {
    constructor(parent: Stack, name: string) {
        super(parent, name);

        const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "RS-OAI")

        const siteBucket = new s3.Bucket(this, "RSStaticBucket", {
            bucketName: `rs-cloudfront-s3-${cdk.Aws.ACCOUNT_ID}`,
            websiteIndexDocument: "index.html",
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        })

        siteBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ["S3:GetObject"],
            resources: [siteBucket.arnForObjects("*")],
            principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
        }))

        const distribution = new cloudfront.CloudFrontWebDistribution(this, "RS-distribution", {
            originConfigs: [{
                s3OriginSource: {
                    s3BucketSource: siteBucket,
                    originAccessIdentity: cloudfrontOAI
                },
                behaviors: [{
                    isDefaultBehavior: true
                }]
            }],
            errorConfigurations: [
                {
                    errorCode: 403,
                    responseCode: 200,
                    responsePagePath: "/index.html",
                },
                {
                    errorCode: 404,
                    responseCode: 200,
                    responsePagePath: "/index.html",
                },
            ],
        })

        const deployment = new s3deploy.BucketDeployment(this, "RS-Bucket-Deployment", {
            sources: [s3deploy.Source.asset("./dist")],
            destinationBucket: siteBucket,
            distribution,
            distributionPaths: ["/*"]
        });

        deployment.node.addDependency(siteBucket);
    }
}