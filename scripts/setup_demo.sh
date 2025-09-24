#!/bin/bash

# Swans Demo Setup Script
# This script demonstrates the complete Swans workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🎬 Swans Campaign Management Demo${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if deployment info exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ No deployment info found. Please run deploy.sh first.${NC}"
    exit 1
fi

# Load environment variables
source .env

echo -e "${GREEN}📦 Package ID: $PACKAGE_ID${NC}"
echo -e "${GREEN}🏛️  Registry ID: $REGISTRY_ID${NC}"
echo -e "${GREEN}👤 Deployer: $DEPLOYER_ADDRESS${NC}"

# Demo configuration
BRAND_NAME="nike_demo"
BRAND_DISPLAY="Nike Demo"
CREATOR_NAME="fitness_influencer"
CREATOR_DISPLAY="Sarah Fitness"
CAMPAIGN_ID="summer_fitness_2024"
CONTENT_ID="workout_video_001"

echo -e "\n${YELLOW}🎯 Demo Scenario: Nike Summer Fitness Campaign${NC}"
echo "Brand: $BRAND_DISPLAY"
echo "Creator: $CREATOR_DISPLAY"  
echo "Campaign: Summer Fitness 2024"

# Create additional test addresses
echo -e "\n${YELLOW}👥 Setting up demo accounts...${NC}"

# Generate new addresses for brand and creator
BRAND_ADDRESS=$(sui client new-address ed25519 | grep "Created new" | awk '{print $4}')
CREATOR_ADDRESS=$(sui client new-address ed25519 | grep "Created new" | awk '{print $4}')

echo -e "${GREEN}✅ Brand address: $BRAND_ADDRESS${NC}"
echo -e "${GREEN}✅ Creator address: $CREATOR_ADDRESS${NC}"

# Request testnet SUI for demo accounts
echo -e "\n${YELLOW}💰 Requesting testnet SUI...${NC}"
curl -X POST "https://faucet.testnet.sui.io/gas" \
     -H "Content-Type: application/json" \
     -d "{\"FixedAmountRequest\":{\"recipient\":\"$BRAND_ADDRESS\"}}" > /dev/null 2>&1

curl -X POST "https://faucet.testnet.sui.io/gas" \
     -H "Content-Type: application/json" \
     -d "{\"FixedAmountRequest\":{\"recipient\":\"$CREATOR_ADDRESS\"}}" > /dev/null 2>&1

echo -e "${GREEN}✅ Testnet SUI requested for demo accounts${NC}"

# Wait for funds to arrive
echo -e "${YELLOW}⏳ Waiting for funds to arrive...${NC}"
sleep 5

# Step 1: Register Brand
echo -e "\n${PURPLE}📋 Step 1: Registering Brand${NC}"
echo -e "${BLUE}Command: Register Nike Demo brand${NC}"

sui client switch --address $BRAND_ADDRESS

REGISTER_BRAND_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module brand \
    --function register_brand \
    --args $REGISTRY_ID "\"$BRAND_NAME\"" "\"$BRAND_DISPLAY\"" "\"https://nike.com/logo.png\"" "\"Just Do It - Summer Fitness Campaign\"" "0x6" \
    --gas-budget 10000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    BRAND_OBJECT_ID=$(echo $REGISTER_BRAND_RESULT | jq -r '.objectChanges[] | select(.objectType | contains("Brand")) | .objectId')
    echo -e "${GREEN}✅ Brand registered successfully!${NC}"
    echo -e "${GREEN}   Brand Object ID: $BRAND_OBJECT_ID${NC}"
else
    echo -e "${RED}❌ Brand registration failed${NC}"
    exit 1
fi

# Step 2: Fund Brand Account
echo -e "\n${PURPLE}💳 Step 2: Funding Brand Account${NC}"
echo -e "${BLUE}Command: Add 10,000 USDC to brand account${NC}"

# Create USDC for demo (in real scenario, brand would transfer real USDC)
MINT_USDC_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module brand \
    --function fund_brand_account \
    --args $BRAND_OBJECT_ID "10000" \
    --gas-budget 10000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Brand account funded with 10,000 USDC${NC}"
else
    echo -e "${YELLOW}⚠️  Brand funding skipped (using mint for demo)${NC}"
fi

# Step 3: Register Creator
echo -e "\n${PURPLE}👤 Step 3: Registering Creator${NC}"
echo -e "${BLUE}Command: Register fitness influencer${NC}"

sui client switch --address $CREATOR_ADDRESS

REGISTER_CREATOR_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module creator \
    --function register_creator \
    --args $REGISTRY_ID "\"$CREATOR_NAME\"" "\"$CREATOR_DISPLAY\"" "\"https://instagram.com/sarahfitness/photo.jpg\"" "\"fitness\"" "\"@sarahfitness\"" "\"@sarahfitness_insta\"" "\"@sarahfit_tiktok\"" "\"@sarahfitness_yt\"" "0x6" \
    --gas-budget 10000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    CREATOR_OBJECT_ID=$(echo $REGISTER_CREATOR_RESULT | jq -r '.objectChanges[] | select(.objectType | contains("Creator")) | .objectId')
    echo -e "${GREEN}✅ Creator registered successfully!${NC}"
    echo -e "${GREEN}   Creator Object ID: $CREATOR_OBJECT_ID${NC}"
else
    echo -e "${RED}❌ Creator registration failed${NC}"
    exit 1
fi

# Step 4: Create Campaign
echo -e "\n${PURPLE}🎯 Step 4: Creating Campaign${NC}"
echo -e "${BLUE}Command: Create Summer Fitness Campaign${NC}"

sui client switch --address $BRAND_ADDRESS

# Calculate timestamps (current time + offsets)
CURRENT_TIME=$(date +%s)000  # Convert to milliseconds
APP_START=$((CURRENT_TIME + 10000))      # Application starts in 10 seconds
APP_END=$((CURRENT_TIME + 300000))       # Application ends in 5 minutes
CAMPAIGN_START=$((CURRENT_TIME + 60000)) # Campaign starts in 1 minute
CAMPAIGN_END=$((CURRENT_TIME + 1800000)) # Campaign ends in 30 minutes

CREATE_CAMPAIGN_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module campaign \
    --function create_campaign \
    --args $REGISTRY_ID $BRAND_OBJECT_ID "\"$CAMPAIGN_ID\"" "\"fitness\"" $APP_START $APP_END $CAMPAIGN_START $CAMPAIGN_END 500 5000 5 2 10 8 15 3 "0x6" \
    --gas-budget 50000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    CAMPAIGN_OBJECT_ID=$(echo $CREATE_CAMPAIGN_RESULT | jq -r '.objectChanges[] | select(.objectType | contains("Campaign")) | .objectId')
    echo -e "${GREEN}✅ Campaign created successfully!${NC}"
    echo -e "${GREEN}   Campaign Object ID: $CAMPAIGN_OBJECT_ID${NC}"
    echo -e "${GREEN}   Budget: 5,000 USDC${NC}"
    echo -e "${GREEN}   Base Pay: 500 USDC per creator${NC}"
    echo -e "${GREEN}   CPM Rates: 5 likes, 2 views, 10 retweets, 8 comments, 15 link clicks${NC}"
else
    echo -e "${RED}❌ Campaign creation failed${NC}"
    exit 1
fi

# Step 5: Creator Applies to Campaign
echo -e "\n${PURPLE}✋ Step 5: Creator Applies to Campaign${NC}"
echo -e "${BLUE}Command: Sarah applies to Summer Fitness Campaign${NC}"

# Wait for application period to start
echo -e "${YELLOW}⏳ Waiting for application period to start...${NC}"
sleep 15

sui client switch --address $CREATOR_ADDRESS

APPLY_CAMPAIGN_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module campaign \
    --function apply_to_campaign \
    --args $CAMPAIGN_OBJECT_ID $CREATOR_OBJECT_ID "0x6" \
    --gas-budget 10000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    APPLICATION_ID=$(echo $APPLY_CAMPAIGN_RESULT | jq -r '.objectChanges[] | select(.objectType | contains("CampaignApplication")) | .objectId')
    echo -e "${GREEN}✅ Creator applied to campaign successfully!${NC}"
    echo -e "${GREEN}   Application ID: $APPLICATION_ID${NC}"
    echo -e "${GREEN}   Status: Auto-approved${NC}"
else
    echo -e "${RED}❌ Campaign application failed${NC}"
    exit 1
fi

# Step 6: Creator Submits Content
echo -e "\n${PURPLE}📸 Step 6: Creator Submits Content${NC}"
echo -e "${BLUE}Command: Submit workout video for review${NC}"

# Wait for campaign period to start
echo -e "${YELLOW}⏳ Waiting for campaign period to start...${NC}"
sleep 45

SUBMIT_CONTENT_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module content \
    --function submit_content \
    --args $CAMPAIGN_OBJECT_ID $CREATOR_OBJECT_ID "\"$CONTENT_ID\"" "\"https://instagram.com/p/summer-workout-routine-2024/\"" "0x6" \
    --gas-budget 15000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    CONTENT_OBJECT_ID=$(echo $SUBMIT_CONTENT_RESULT | jq -r '.objectChanges[] | select(.objectType | contains("Content")) | .objectId')
    echo -e "${GREEN}✅ Content submitted successfully!${NC}"
    echo -e "${GREEN}   Content Object ID: $CONTENT_OBJECT_ID${NC}"
    echo -e "${GREEN}   Link: https://instagram.com/p/summer-workout-routine-2024/${NC}"
    echo -e "${GREEN}   Status: Pending Review${NC}"
else
    echo -e "${RED}❌ Content submission failed${NC}"
    exit 1
fi

# Step 7: Brand Reviews Content
echo -e "\n${PURPLE}👀 Step 7: Brand Reviews and Approves Content${NC}"
echo -e "${BLUE}Command: Nike approves Sarah's workout video${NC}"

sui client switch --address $BRAND_ADDRESS

REVIEW_CONTENT_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module content \
    --function review_content \
    --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID true "\"Amazing workout routine! Perfect fit for our summer fitness campaign. Great production quality and aligns perfectly with Nike brand values.\"" "0x6" \
    --gas-budget 10000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Content approved by brand!${NC}"
    echo -e "${GREEN}   Review: Amazing workout routine! Perfect fit for campaign.${NC}"
    echo -e "${GREEN}   Status: Approved → Ready to Publish${NC}"
else
    echo -e "${RED}❌ Content review failed${NC}"
    exit 1
fi

# Step 8: Creator Publishes Content (Triggers Base Payment)
echo -e "\n${PURPLE}🚀 Step 8: Creator Publishes Content${NC}"
echo -e "${BLUE}Command: Publish content and receive base payment${NC}"

sui client switch --address $CREATOR_ADDRESS

PUBLISH_CONTENT_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module content \
    --function publish_content \
    --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID $CREATOR_OBJECT_ID "0x6" \
    --gas-budget 20000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Content published successfully!${NC}"
    echo -e "${GREEN}   Base Payment: 500 USDC sent to creator${NC}"
    echo -e "${GREEN}   Status: Published → Live${NC}"
    echo -e "${GREEN}   Payment Receipt: Generated automatically${NC}"
else
    echo -e "${RED}❌ Content publication failed${NC}"
    exit 1
fi

# Step 9: Update Engagement Metrics
echo -e "\n${PURPLE}📊 Step 9: Update Engagement Metrics${NC}"
echo -e "${BLUE}Command: Add performance metrics after 24 hours${NC}"

sui client switch --address $BRAND_ADDRESS

UPDATE_METRICS_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module content \
    --function update_engagement_metrics \
    --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID 2500 15000 450 320 180 \
    --gas-budget 10000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Engagement metrics updated!${NC}"
    echo -e "${GREEN}   📍 Likes: 2,500 (25 × 5 = 125 USDC bonus)${NC}"
    echo -e "${GREEN}   👁️  Views: 15,000 (150 × 2 = 300 USDC bonus)${NC}"
    echo -e "${GREEN}   🔄 Retweets: 450 (4.5 × 10 = 45 USDC bonus)${NC}"
    echo -e "${GREEN}   💬 Comments: 320 (3.2 × 8 = 25.6 USDC bonus)${NC}"
    echo -e "${GREEN}   🔗 Link Clicks: 180 (1.8 × 15 = 27 USDC bonus)${NC}"
    echo -e "${GREEN}   💰 Total Engagement Bonus: ~522.6 USDC${NC}"
else
    echo -e "${RED}❌ Metrics update failed${NC}"
    exit 1
fi

# Step 10: Select Winners and Process Bonus
echo -e "\n${PURPLE}🏆 Step 10: Select Winners and Process Bonus Payment${NC}"
echo -e "${BLUE}Command: Nike selects Sarah as campaign winner${NC}"

SELECT_WINNERS_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module campaign \
    --function select_campaign_winners \
    --args $CAMPAIGN_OBJECT_ID "[\"$CREATOR_NAME\"]" \
    --gas-budget 15000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Winners selected successfully!${NC}"
    echo -e "${GREEN}   🏆 Winner: $CREATOR_DISPLAY${NC}"
    echo -e "${GREEN}   Campaign Status: Completed${NC}"
else
    echo -e "${RED}❌ Winner selection failed${NC}"
fi

# Process bonus payment
PROCESS_BONUS_RESULT=$(sui client call \
    --package $PACKAGE_ID \
    --module content \
    --function process_bonus_payment \
    --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID $CREATOR_OBJECT_ID "0x6" \
    --gas-budget 20000000 \
    --json 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Bonus payment processed!${NC}"
    echo -e "${GREEN}   💰 Engagement bonus paid to creator${NC}"
    echo -e "${GREEN}   🧾 Bonus payment receipt generated${NC}"
else
    echo -e "${YELLOW}⚠️  Bonus payment skipped${NC}"
fi

# Demo Summary
echo -e "\n${PURPLE}🎉 Demo Complete - Campaign Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ Brand Registration: $BRAND_DISPLAY${NC}"
echo -e "${GREEN}✅ Creator Registration: $CREATOR_DISPLAY${NC}"
echo -e "${GREEN}✅ Campaign Creation: $CAMPAIGN_ID${NC}"
echo -e "${GREEN}✅ Creator Application: Auto-approved${NC}"
echo -e "${GREEN}✅ Content Submission: Workout Video${NC}"
echo -e "${GREEN}✅ Brand Review: Approved${NC}"
echo -e "${GREEN}✅ Content Publication: Live + Base Payment${NC}"
echo -e "${GREEN}✅ Engagement Tracking: High Performance${NC}"
echo -e "${GREEN}✅ Winner Selection: $CREATOR_DISPLAY${NC}"
echo -e "${GREEN}✅ Bonus Payment: Performance-based bonus${NC}"

echo -e "\n${PURPLE}💰 Payment Summary${NC}"
echo -e "${GREEN}Base Payment: 500 USDC${NC}"
echo -e "${GREEN}Engagement Bonus: ~522.6 USDC${NC}"
echo -e "${GREEN}Total Earned: ~1,022.6 USDC${NC}"

echo -e "\n${PURPLE}📋 Object IDs for Reference${NC}"
echo "PACKAGE_ID=$PACKAGE_ID"
echo "REGISTRY_ID=$REGISTRY_ID"
echo "BRAND_OBJECT_ID=$BRAND_OBJECT_ID"
echo "CREATOR_OBJECT_ID=$CREATOR_OBJECT_ID"
echo "CAMPAIGN_OBJECT_ID=$CAMPAIGN_OBJECT_ID"
echo "CONTENT_OBJECT_ID=$CONTENT_OBJECT_ID"

echo -e "\n${BLUE}🔍 View Objects:${NC}"
echo "sui client object $CAMPAIGN_OBJECT_ID"
echo "sui client object $CONTENT_OBJECT_ID"

echo -e "\n${BLUE}📊 View Events:${NC}"
echo "sui client events --package $PACKAGE_ID"

echo -e "\n${GREEN}🎬 Demo completed successfully! All core features demonstrated.${NC}"