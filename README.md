# Serverless Selective Functions

[![Serverless][ico-serverless]][link-serverless]
[![License][ico-license]][link-license]

A Serverless plugin that enables you to selectively deploy functions for specific stages.

## Installation

`npm i serverless-selective-functions --save-dev`

Add the plugin to your `serverless.yml` file:

```
plugins:
  - serverless-selective-functions
```

## Usage

```yaml
# Everything included by default
addVote:
  handler: src/functionHandlers/addVote/index.handler
  events:
    - http:
        path: /v1/vote
        method: post
        cors: true
  # Not specifying the `stages` property will include this function

# Exclude all prod-[0-9]*
deleteVote:
  handler: src/functionHandlers/deleteVote/index.handler
  events:
    - http:
        path: /v1/vote
        method: delete
        cors: true
  stages:
    exclude: # Specify stages that should exclude this function
      - "prod-[0-9]*" # Regex

# Include all dev-.* except dev-123
# Note that checks will run through the inclusion list first, then the exclusion list
editVote:
  handler: src/functionHandlers/editVote/index.handler
  events:
    - http:
        path: /v1/vote
        method: patch
        cors: true
  stages: # Stage will be tested with both the include and exclude properties
    include:
      - "dev-.*"
    exclude:
      - "dev-123"

# Include dev-123 and all prod-.*
summary:
  handler: src/functionHandlers/summary/index.handler
  events:
    - http:
        path: /v1/summary
        method: get
        cors: true
  stages:
    include:
      - "dev-123"
      - "prod-.*"
```

## Why?

You may want to deploy some functions as specified in your `serverless.yml` only for a specific stage. A simple approach would be the following:

```yaml
functions:
  - ${file(serverless/functions/base.yml)}
  - ${file(serverless/functions/${self:provider.stage}.yml)}
```

Then if you wanted to deploy functions only when the stage is set to `offline`, you can create a `serverless/functions/offline.yml` file and populate it with functions meant only for the `offline` stage.

The approach works for simple cases, but lets say you want to deploy the following functions for 3 stages:

```yaml
prod: lambdaA, lambdaB
staging: lambdaB
offline: lambdaA, lambdaC
```

Given that there isn't a common subset of functions, you cannot create a `base.yml`. If you create a `prod.yml` with `lambdaA` + `lambdaB`, and `staging.yml` with `lambdaB`, you will then need to maintain 2 separate definitions of `lambdaB` which would be error prone. This restricts you to having mutually exclusive sets of functions defined in different yml files, otherwise we tradeoff maintainability.

[ico-serverless]: http://public.serverless.com/badges/v3.svg
[ico-license]: https://img.shields.io/github/license/serverless-heaven/serverless-webpack.svg
[link-serverless]: https://www.serverless.com/
[link-license]: ./LICENSE
