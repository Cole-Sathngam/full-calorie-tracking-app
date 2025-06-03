"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalorieApiInfrastructureStackV2 = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
const iam = require("aws-cdk-lib/aws-iam");
class CalorieApiInfrastructureStackV2 extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // RDS instance details from environment variables with validation
        const rdsEndpoint = process.env.RDS_ENDPOINT;
        const rdsPortStr = process.env.RDS_PORT;
        const dbName = process.env.DB_NAME;
        const dbUsername = process.env.DB_USERNAME;
        // Validate required environment variables
        if (!rdsEndpoint) {
            throw new Error('RDS_ENDPOINT environment variable is required');
        }
        if (!rdsPortStr) {
            throw new Error('RDS_PORT environment variable is required');
        }
        if (!dbName) {
            throw new Error('DB_NAME environment variable is required');
        }
        if (!dbUsername) {
            throw new Error('DB_USERNAME environment variable is required');
        }
        const rdsPort = parseInt(rdsPortStr, 10);
        if (isNaN(rdsPort)) {
            throw new Error('RDS_PORT must be a valid number');
        }
        // Database credentials secret
        const dbCredentials = new secretsmanager.Secret(this, 'ExistingDbCredentials', {
            description: 'Credentials for existing calorie-db-1 database',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: dbUsername }),
                generateStringKey: 'password',
                excludeCharacters: '"@/\\',
            },
        });
        // Lambda function for API (outside VPC for simplicity since RDS is publicly accessible)
        const apiFunction = new lambda.Function(this, 'CalorieApiFunction', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                DB_SECRET_ARN: dbCredentials.secretArn,
                DB_ENDPOINT: rdsEndpoint,
                DB_PORT: rdsPort.toString(),
                DB_NAME: dbName,
            },
            timeout: cdk.Duration.seconds(30),
        });
        // Grant Lambda permissions to access secrets
        dbCredentials.grantRead(apiFunction);
        // Grant Lambda permissions to connect to RDS
        apiFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'rds:DescribeDBInstances',
                'rds:Connect'
            ],
            resources: [`arn:aws:rds:us-east-2:${this.account}:db:calorie-db-1`]
        }));
        // API Gateway
        const api = new apigateway.RestApi(this, 'CalorieApi', {
            restApiName: 'Calorie Tracking API',
            description: 'API for calorie tracking application',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent'
                ],
                allowCredentials: false,
            },
        });
        // Lambda integration
        const lambdaIntegration = new apigateway.LambdaIntegration(apiFunction);
        // API resources and methods
        const foodsResource = api.root.addResource('foods');
        foodsResource.addMethod('GET', lambdaIntegration);
        foodsResource.addMethod('POST', lambdaIntegration);
        // Add proxy resource for dynamic routes
        const proxyResource = foodsResource.addResource('{proxy+}');
        proxyResource.addMethod('ANY', lambdaIntegration);
        // Outputs
        new cdk.CfnOutput(this, 'ApiGatewayUrl', {
            value: api.url,
            description: 'API Gateway URL',
        });
        new cdk.CfnOutput(this, 'DatabaseEndpoint', {
            value: rdsEndpoint,
            description: 'Existing RDS PostgreSQL endpoint',
        });
        new cdk.CfnOutput(this, 'DatabaseSecretArn', {
            value: dbCredentials.secretArn,
            description: 'Database credentials secret ARN - Update with your RDS password',
        });
        // Instructions output
        new cdk.CfnOutput(this, 'PostDeploymentInstructions', {
            value: `Update the secret with your RDS password: aws secretsmanager update-secret --secret-id ${dbCredentials.secretArn} --secret-string '{"username":"postgres","password":"YOUR_ACTUAL_PASSWORD"}'`,
            description: 'Run this command after deployment',
        });
    }
}
exports.CalorieApiInfrastructureStackV2 = CalorieApiInfrastructureStackV2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2Fsb3JpZS1hcGktaW5mcmFzdHJ1Y3R1cmUtc3RhY2stdjIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWxvcmllLWFwaS1pbmZyYXN0cnVjdHVyZS1zdGFjay12Mi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsaURBQWlEO0FBQ2pELHlEQUF5RDtBQUN6RCxpRUFBaUU7QUFDakUsMkNBQTJDO0FBRzNDLE1BQWEsK0JBQWdDLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixrRUFBa0U7UUFDbEUsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7UUFDN0MsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDeEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDbkMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7UUFFM0MsMENBQTBDO1FBQzFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUNELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FB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NUQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUVsRCxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHO1lBQ2QsV0FBVyxFQUFFLGlCQUFpQjtTQUMvQixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxXQUFXO1lBQ2xCLFdBQVcsRUFBRSxrQ0FBa0M7U0FDaEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsYUFBYSxDQUFDLFNBQVM7WUFDOUIsV0FBVyxFQUFFLGlFQUFpRTtTQUMvRSxDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFDdEIsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSw0QkFBNEIsRUFBRTtZQUNwRCxLQUFLLEVBQUUsMEZBQTBGLGFBQWEsQ0FBQyxTQUFTLDhFQUE4RTtZQUN0TSxXQUFXLEVBQUUsbUNBQW1DO1NBQ2pELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZIRCwwRUF1SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XHJcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xyXG5pbXBvcnQgKiBhcyBzZWNyZXRzbWFuYWdlciBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc2VjcmV0c21hbmFnZXInO1xyXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIENhbG9yaWVBcGlJbmZyYXN0cnVjdHVyZVN0YWNrVjIgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vIFJEUyBpbnN0YW5jZSBkZXRhaWxzIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIHdpdGggdmFsaWRhdGlvblxyXG4gICAgY29uc3QgcmRzRW5kcG9pbnQgPSBwcm9jZXNzLmVudi5SRFNfRU5EUE9JTlQ7XHJcbiAgICBjb25zdCByZHNQb3J0U3RyID0gcHJvY2Vzcy5lbnYuUkRTX1BPUlQ7XHJcbiAgICBjb25zdCBkYk5hbWUgPSBwcm9jZXNzLmVudi5EQl9OQU1FO1xyXG4gICAgY29uc3QgZGJVc2VybmFtZSA9IHByb2Nlc3MuZW52LkRCX1VTRVJOQU1FO1xyXG5cclxuICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIGVudmlyb25tZW50IHZhcmlhYmxlc1xyXG4gICAgaWYgKCFyZHNFbmRwb2ludCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JEU19FTkRQT0lOVCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyByZXF1aXJlZCcpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFyZHNQb3J0U3RyKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignUkRTX1BPUlQgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgcmVxdWlyZWQnKTtcclxuICAgIH1cclxuICAgIGlmICghZGJOYW1lKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignREJfTkFNRSBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyByZXF1aXJlZCcpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFkYlVzZXJuYW1lKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignREJfVVNFUk5BTUUgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgcmVxdWlyZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCByZHNQb3J0ID0gcGFyc2VJbnQocmRzUG9ydFN0ciwgMTApO1xyXG4gICAgaWYgKGlzTmFOKHJkc1BvcnQpKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignUkRTX1BPUlQgbXVzdCBiZSBhIHZhbGlkIG51bWJlcicpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERhdGFiYXNlIGNyZWRlbnRpYWxzIHNlY3JldFxyXG4gICAgY29uc3QgZGJDcmVkZW50aWFscyA9IG5ldyBzZWNyZXRzbWFuYWdlci5TZWNyZXQodGhpcywgJ0V4aXN0aW5nRGJDcmVkZW50aWFscycsIHtcclxuICAgICAgZGVzY3JpcHRpb246ICdDcmVkZW50aWFscyBmb3IgZXhpc3RpbmcgY2Fsb3JpZS1kYi0xIGRhdGFiYXNlJyxcclxuICAgICAgZ2VuZXJhdGVTZWNyZXRTdHJpbmc6IHtcclxuICAgICAgICBzZWNyZXRTdHJpbmdUZW1wbGF0ZTogSlNPTi5zdHJpbmdpZnkoeyB1c2VybmFtZTogZGJVc2VybmFtZSB9KSxcclxuICAgICAgICBnZW5lcmF0ZVN0cmluZ0tleTogJ3Bhc3N3b3JkJyxcclxuICAgICAgICBleGNsdWRlQ2hhcmFjdGVyczogJ1wiQC9cXFxcJyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExhbWJkYSBmdW5jdGlvbiBmb3IgQVBJIChvdXRzaWRlIFZQQyBmb3Igc2ltcGxpY2l0eSBzaW5jZSBSRFMgaXMgcHVibGljbHkgYWNjZXNzaWJsZSlcclxuICAgIGNvbnN0IGFwaUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQ2Fsb3JpZUFwaUZ1bmN0aW9uJywge1xyXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcclxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYScpLFxyXG4gICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgIERCX1NFQ1JFVF9BUk46IGRiQ3JlZGVudGlhbHMuc2VjcmV0QXJuLFxyXG4gICAgICAgIERCX0VORFBPSU5UOiByZHNFbmRwb2ludCxcclxuICAgICAgICBEQl9QT1JUOiByZHNQb3J0LnRvU3RyaW5nKCksXHJcbiAgICAgICAgREJfTkFNRTogZGJOYW1lLFxyXG4gICAgICB9LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBHcmFudCBMYW1iZGEgcGVybWlzc2lvbnMgdG8gYWNjZXNzIHNlY3JldHNcclxuICAgIGRiQ3JlZGVudGlhbHMuZ3JhbnRSZWFkKGFwaUZ1bmN0aW9uKTtcclxuXHJcbiAgICAvLyBHcmFudCBMYW1iZGEgcGVybWlzc2lvbnMgdG8gY29ubmVjdCB0byBSRFNcclxuICAgIGFwaUZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICdyZHM6RGVzY3JpYmVEQkluc3RhbmNlcycsXHJcbiAgICAgICAgJ3JkczpDb25uZWN0J1xyXG4gICAgICBdLFxyXG4gICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpyZHM6dXMtZWFzdC0yOiR7dGhpcy5hY2NvdW50fTpkYjpjYWxvcmllLWRiLTFgXVxyXG4gICAgfSkpO1xyXG5cclxuICAgIC8vIEFQSSBHYXRld2F5XHJcbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsICdDYWxvcmllQXBpJywge1xyXG4gICAgICByZXN0QXBpTmFtZTogJ0NhbG9yaWUgVHJhY2tpbmcgQVBJJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgZm9yIGNhbG9yaWUgdHJhY2tpbmcgYXBwbGljYXRpb24nLFxyXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcclxuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcclxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcclxuICAgICAgICAgICdDb250ZW50LVR5cGUnLFxyXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxyXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxyXG4gICAgICAgICAgJ1gtQXBpLUtleScsXHJcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxyXG4gICAgICAgICAgJ1gtQW16LVVzZXItQWdlbnQnXHJcbiAgICAgICAgXSxcclxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExhbWJkYSBpbnRlZ3JhdGlvblxyXG4gICAgY29uc3QgbGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhcGlGdW5jdGlvbik7XHJcblxyXG4gICAgLy8gQVBJIHJlc291cmNlcyBhbmQgbWV0aG9kc1xyXG4gICAgY29uc3QgZm9vZHNSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdmb29kcycpO1xyXG4gICAgZm9vZHNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIGxhbWJkYUludGVncmF0aW9uKTtcclxuICAgIGZvb2RzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbGFtYmRhSW50ZWdyYXRpb24pO1xyXG5cclxuICAgIC8vIEFkZCBwcm94eSByZXNvdXJjZSBmb3IgZHluYW1pYyByb3V0ZXNcclxuICAgIGNvbnN0IHByb3h5UmVzb3VyY2UgPSBmb29kc1Jlc291cmNlLmFkZFJlc291cmNlKCd7cHJveHkrfScpO1xyXG4gICAgcHJveHlSZXNvdXJjZS5hZGRNZXRob2QoJ0FOWScsIGxhbWJkYUludGVncmF0aW9uKTtcclxuXHJcbiAgICAvLyBPdXRwdXRzXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheVVybCcsIHtcclxuICAgICAgdmFsdWU6IGFwaS51cmwsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgVVJMJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZUVuZHBvaW50Jywge1xyXG4gICAgICB2YWx1ZTogcmRzRW5kcG9pbnQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRXhpc3RpbmcgUkRTIFBvc3RncmVTUUwgZW5kcG9pbnQnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RhdGFiYXNlU2VjcmV0QXJuJywge1xyXG4gICAgICB2YWx1ZTogZGJDcmVkZW50aWFscy5zZWNyZXRBcm4sXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2UgY3JlZGVudGlhbHMgc2VjcmV0IEFSTiAtIFVwZGF0ZSB3aXRoIHlvdXIgUkRTIHBhc3N3b3JkJyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc3RydWN0aW9ucyBvdXRwdXRcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdQb3N0RGVwbG95bWVudEluc3RydWN0aW9ucycsIHtcclxuICAgICAgdmFsdWU6IGBVcGRhdGUgdGhlIHNlY3JldCB3aXRoIHlvdXIgUkRTIHBhc3N3b3JkOiBhd3Mgc2VjcmV0c21hbmFnZXIgdXBkYXRlLXNlY3JldCAtLXNlY3JldC1pZCAke2RiQ3JlZGVudGlhbHMuc2VjcmV0QXJufSAtLXNlY3JldC1zdHJpbmcgJ3tcInVzZXJuYW1lXCI6XCJwb3N0Z3Jlc1wiLFwicGFzc3dvcmRcIjpcIllPVVJfQUNUVUFMX1BBU1NXT1JEXCJ9J2AsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUnVuIHRoaXMgY29tbWFuZCBhZnRlciBkZXBsb3ltZW50JyxcclxuICAgIH0pO1xyXG4gIH1cclxufSAiXX0=