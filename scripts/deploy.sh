#!/bin/bash

# Swans Campaign Management - Deployment Script
# This script deploys the Swans smart contracts to Sui network

set -e

echo "🚀 Deploying Swans Campaign Management System to Sui..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${1:-"testnet"}
GAS_BUDGET=${2:-"100000000"}

echo -e "${BLUE}Network: $NETWORK${NC}"
echo -e "${BLUE}Gas Budget: $GAS_BUDGET${NC}"

# Check if Sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo -e "${RED}❌ Sui CLI not found. Please install it first.${NC}"
    echo "Visit: https://docs.sui.io/build/install"
    exit 1
fi

# Check if we have an active address
if ! sui client active-address &> /dev/null; then
    echo -e "${RED}❌ No active Sui address found. Please set up your Sui client first.${NC}"
    echo "Run: sui client new-address ed25519"
    exit 1
fi

ACTIVE_ADDRESS=$(sui client active-address)
echo -e "${GREEN}✅ Active address: $ACTIVE_ADDRESS${NC}"

# Check balance
echo -e "${YELLOW}💰 Checking SUI balance...${NC}"
sui client balance

# Build the project
echo -e "${YELLOW}🔨 Building Swans contracts...${NC}"
if ! sui move build; then
    echo -e "${RED}❌ Build failed! Please check your code for errors.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful!${NC}"

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
if ! sui move test; then
    echo -e "${YELLOW}⚠️  Some tests failed, but continuing with deployment...${NC}"
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
fi

# Deploy the contracts
echo -e "${YELLOW}📦 Publishing contracts to $NETWORK...${NC}"
PUBLISH_RESULT=$(sui client publish --gas-budget $GAS_BUDGET --json)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"

# Extract important information from the publish result
PACKAGE_ID=$(echo $PUBLISH_RESULT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
REGISTRY_ID=$(echo $PUBLISH_RESULT | jq -r '.objectChanges[] | select(.objectType | contains("PlatformRegistry")) | .objectId')

echo -e "${GREEN}📋 Deployment Summary:${NC}"
echo -e "${BLUE}Package ID: $PACKAGE_ID${NC}"
echo -e "${BLUE}Registry ID: $REGISTRY_ID${NC}"

# Save deployment info
DEPLOY_INFO="deployment_info_$(date +%Y%m%d_%H%M%S).json"
echo $PUBLISH_RESULT > $DEPLOY_INFO
echo -e "${GREEN}✅ Deployment info saved to: $DEPLOY_INFO${NC}"

# Create environment file
ENV_FILE=".env"
cat > $ENV_FILE << EOF
# Swans Deployment Configuration
NETWORK=$NETWORK
PACKAGE_ID=$PACKAGE_ID
REGISTRY_ID=$REGISTRY_ID
DEPLOYER_ADDRESS=$ACTIVE_ADDRESS
DEPLOY_DATE=$(date)
EOF

echo -e "${GREEN}✅ Environment file created: $ENV_FILE${NC}"

echo -e "${GREEN}🎉 Swans Campaign Management System deployed successfully!${NC}"
echo -e "${YELLOW}📚 Next steps:${NC}"
echo "1. Update your frontend with the new Package ID: $PACKAGE_ID"
echo "2. Update your backend with the Registry ID: $REGISTRY_ID"
echo "3. Test the deployment with the provided test scripts"
echo "4. Register your first brand and creator accounts"

echo -e "${BLUE}🔗 Useful commands:${NC}"
echo "- View package: sui client object $PACKAGE_ID"
echo "- View registry: sui client object $REGISTRY_ID"
echo "- Check events: sui client events --package $PACKAGE_ID"