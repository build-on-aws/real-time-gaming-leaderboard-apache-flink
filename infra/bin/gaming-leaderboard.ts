#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {GamingLeaderboardStack} from "../lib/gaming-leaderboard-stack";


const app = new cdk.App();
new GamingLeaderboardStack(app, 'GamingLeaderboardStack',{
    description: "Gaming Leaderboard Stack (uksb-ruuif573cd)"
});
