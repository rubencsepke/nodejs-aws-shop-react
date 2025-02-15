#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSite } from './static-site.ts';

class MyStaticSiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string) {
    super(parent, name);

    new StaticSite(this, 'RSStaticWebsite');
  }
}

const app = new cdk.App();

new MyStaticSiteStack(app, 'MyRSStaticWebsite');

app.synth();