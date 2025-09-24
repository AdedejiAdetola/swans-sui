# Swans Workflow Guide

Complete step-by-step guide for brands and creators using the Swans campaign management platform.

## Table of Contents
- [Overview](#overview)
- [Brand Workflow](#brand-workflow)
- [Creator Workflow](#creator-workflow)
- [Payment Flow](#payment-flow)
- [Dispute Resolution](#dispute-resolution)
- [Best Practices](#best-practices)

## Overview

Swans enables brands to create influencer marketing campaigns with automated payments and transparent performance tracking. The platform uses smart contracts on Sui blockchain to ensure trust and automate processes.

### Key Actors
- **Brands**: Companies creating advertising campaigns
- **Creators**: Content creators participating in campaigns  
- **Admin**: Platform administrators handling disputes and verification

### Core Concepts
- **Base Payment**: Fixed payment when content is published
- **Bonus Payment**: Performance-based payment calculated using CPM rates
- **CPM**: Cost Per Mille (per 1,000), but implemented as cost per 100 in our system
- **Escrow**: Secure holding of campaign funds until distribution

---

## Brand Workflow

### Phase 1: Platform Setup

#### 1.1 Register Brand Account
```bash
# Register your brand on the platform
sui client call --package $PACKAGE_ID --module brand --function register_brand \
  --args $REGISTRY_ID "your_brand_id" "Your Brand Name" "logo_url" "Brand Description" $CLOCK_ID
```

**Requirements**:
- Unique brand ID (e.g., "nike", "adidas")
- Professional brand name and description
- High-quality logo image URL

**Result**: Brand object created and transferred to your address

#### 1.2 Fund Brand Account
```bash
# Add USDC to your brand account for campaigns
sui client call --package $PACKAGE_ID --module brand --function fund_brand_account \
  --args $BRAND_OBJECT_ID $USDC_COIN_OBJECT_ID
```

**Best Practices**:
- Fund account before creating campaigns
- Keep sufficient balance for all planned campaigns
- Monitor spending across multiple campaigns

### Phase 2: Campaign Creation

#### 2.1 Plan Your Campaign

**Key Decisions**:
- Campaign duration and timing
- Total budget allocation
- Base payment per creator
- CPM rates for different engagement types
- Maximum number of winners

**Budget Calculation Example**:
```
Estimated Participants: 50 creators
Base Pay: 100 USDC each = 5,000 USDC
Estimated Bonus Pool: 5,000 USDC
Total Budget: 10,000 USDC
```

#### 2.2 Create Campaign
```bash
# Create your campaign with all parameters
sui client call --package $PACKAGE_ID --module campaign --function create_campaign \
  --args $REGISTRY_ID $BRAND_OBJECT_ID "campaign_id" "category" \
         $APP_START $APP_END $CAMPAIGN_START $CAMPAIGN_END \
         $BASE_PAY $TOTAL_BUDGET \
         $CPM_LIKES $CPM_VIEWS $CPM_RETWEETS $CPM_COMMENTS $CPM_CLICKS \
         $MAX_WINNERS $CLOCK_ID
```

**Parameters Explained**:
- `APP_START/END`: When creators can apply (timestamps in ms)
- `CAMPAIGN_START/END`: When content creation happens
- `BASE_PAY`: Fixed payment per published content (USDC)
- `CPM_*`: Cost per 100 engagements for each metric
- `MAX_WINNERS`: How many creators get bonus payments

### Phase 3: Campaign Management

#### 3.1 Monitor Applications
- Applications are auto-approved during application period
- Track applicant quality and fit for your brand
- Consider creator profiles and past performance

#### 3.2 Review Content Submissions
```bash
# Review submitted content - approve or reject
sui client call --package $PACKAGE_ID --module content --function review_content \
  --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID true "Great content! Approved." $CLOCK_ID
```

**Review Criteria**:
- Brand alignment and message consistency
- Content quality and production value
- Compliance with campaign guidelines
- Authenticity and engagement potential

#### 3.3 Track Published Content
- Monitor when creators publish approved content
- Base payments are automatically processed
- Track real-time campaign performance

### Phase 4: Performance & Payments

#### 4.1 Update Engagement Metrics
```bash
# Update metrics after content has been live (24-48 hours)
sui client call --package $PACKAGE_ID --module content --function update_engagement_metrics \
  --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID $LIKES $VIEWS $RETWEETS $COMMENTS $CLICKS
```

**Timing**: Update metrics 24-48 hours after publication for accurate data

#### 4.2 Select Winners
```bash
# Select top performing creators for bonus payments
sui client call --package $PACKAGE_ID --module campaign --function select_campaign_winners \
  --args $CAMPAIGN_OBJECT_ID '["creator1", "creator2", "creator3"]'
```

**Selection Criteria**:
- Highest engagement rates
- Best content quality
- Brand alignment
- Audience reach and relevance

#### 4.3 Process Bonus Payments
```bash
# Process bonus payments for selected winners
sui client call --package $PACKAGE_ID --module content --function process_bonus_payment \
  --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID $CREATOR_OBJECT_ID $CLOCK_ID
```

**Bonus Calculation**:
```
Bonus = (Likes ÷ 100 × CPM_Likes) + 
        (Views ÷ 100 × CPM_Views) + 
        (Retweets ÷ 100 × CPM_Retweets) + 
        (Comments ÷ 100 × CPM_Comments) + 
        (Link Clicks ÷ 100 × CPM_Link_Clicks)
```

---

## Creator Workflow

### Phase 1: Platform Setup

#### 1.1 Register Creator Account
```bash
# Register as a creator on the platform
sui client call --package $PACKAGE_ID --module creator --function register_creator \
  --args $REGISTRY_ID "creator_id" "Display Name" "profile_image_url" "category" \
         "@twitter" "@instagram" "@tiktok" "@youtube" $CLOCK_ID
```

**Profile Tips**:
- Choose a memorable, professional creator ID
- Use high-quality profile images
- Select accurate content category
- Link all relevant social media accounts

#### 1.2 Build Your Profile
- Complete all profile information
- Upload portfolio/sample content
- Build reputation through successful campaigns
- Seek platform verification for credibility

### Phase 2: Campaign Discovery & Application

#### 2.1 Find Relevant Campaigns
- Browse active campaigns in your category
- Check campaign requirements and CPM rates
- Evaluate brand fit and audience alignment
- Review application deadlines

#### 2.2 Apply to Campaigns
```bash
# Apply to campaigns during application period
sui client call --package $PACKAGE_ID --module campaign --function apply_to_campaign \
  --args $CAMPAIGN_OBJECT_ID $CREATOR_OBJECT_ID $CLOCK_ID
```

**Application Strategy**:
- Apply early during application window
- Focus on campaigns matching your niche
- Consider payment rates and brand reputation
- Track your application status

### Phase 3: Content Creation

#### 3.1 Plan Your Content
**Before Creating**:
- Review campaign guidelines and requirements
- Study brand voice and aesthetic
- Plan content that aligns with your audience
- Ensure you can meet posting deadlines

#### 3.2 Submit Content for Review
```bash
# Submit your content for brand approval
sui client call --package $PACKAGE_ID --module content --function submit_content \
  --args $CAMPAIGN_OBJECT_ID $CREATOR_OBJECT_ID "content_id" "content_link" $CLOCK_ID
```

**Submission Best Practices**:
- Submit high-quality, original content
- Follow all campaign guidelines
- Include required hashtags and mentions
- Provide clear, accessible content links

#### 3.3 Handle Review Feedback
- Respond promptly to review comments
- Make requested revisions if content is rejected
- Resubmit improved content quickly
- Maintain professional communication

### Phase 4: Publication & Earnings

#### 4.1 Publish Approved Content
```bash
# Publish your approved content to receive base payment
sui client call --package $PACKAGE_ID --module content --function publish_content \
  --args $CAMPAIGN_OBJECT_ID $CONTENT_OBJECT_ID $CREATOR_OBJECT_ID $CLOCK_ID
```

**Publication Checklist**:
- Ensure content is live on your social platforms
- Verify all required tags and mentions
- Base payment is automatically sent upon publication
- Keep content live for campaign duration

#### 4.2 Maximize Engagement
**Growth Strategies**:
- Engage with your audience in comments
- Share content across multiple platforms
- Use relevant hashtags for discovery
- Collaborate with other creators
- Post at optimal times for your audience

#### 4.3 Track Performance
- Monitor likes, views, comments, and shares
- Track link clicks if applicable
- Analyze which content performs best
- Build strategies for future campaigns

#### 4.4 Receive Payments
- **Base Payment**: Automatic upon content publication
- **Bonus Payment**: Processed if selected as winner
- **Payment Receipts**: Automatically generated for tracking
- **Earnings History**: Track total earnings across campaigns

---

## Payment Flow

### Payment Types

#### Base Payments
- **Trigger**: Content publication after approval
- **Amount**: Fixed amount per campaign
- **Processing**: Automatic via smart contract
- **Timeline**: Immediate upon publication

#### Bonus Payments  
- **Trigger**: Winner selection + engagement metrics
- **Amount**: Calculated using CPM rates and actual engagement
- **Processing**: Manual brand action
- **Timeline**: After campaign completion

### Payment Timeline
```
Content Submission → Brand Review → Publication → Base Payment
                                      ↓
Performance Tracking → Winner Selection → Bonus Payment
```

### Payment Receipts
All payments generate on-chain receipts containing:
- Payment type (base/bonus)
- Amount paid
- Campaign ID
- Recipient details
- Transaction hash
- Timestamp

---

## Dispute Resolution

### When to Open a Dispute

#### Common Dispute Types
- **Payment Issues**: Missing or incorrect payments
- **Content Issues**: Unfair rejection or brand guideline disputes
- **Contract Violations**: Failure to meet campaign requirements
- **Communication Problems**: Unresponsive parties

### Dispute Process

#### 1. Open Dispute
```bash
# Either brand or creator can open a dispute
sui client call --package $PACKAGE_ID --module dispute --function open_dispute \
  --args $CAMPAIGN_OBJECT_ID "dispute_id" "creator_id" "dispute_type" "description" $CLOCK_ID
```

#### 2. Submit Evidence
```bash
# Both parties can submit evidence
sui client call --package $PACKAGE_ID --module dispute --function add_dispute_evidence \
  --args $DISPUTE_OBJECT_ID "evidence_description_or_link"
```

**Evidence Types**:
- Screenshots and documentation
- Communication records
- Performance data
- Contract terms and agreements

#### 3. Resolution
- **Mutual Agreement**: Parties resolve privately
- **Admin Resolution**: Platform admin makes final decision
- **Timeline**: 7-14 days for resolution

### Best Practices for Disputes
- Document all interactions
- Communicate professionally
- Provide clear, factual evidence
- Be open to reasonable compromises
- Follow platform guidelines

---

## Best Practices

### For Brands

#### Campaign Planning
- **Budget Planning**: Allocate 60% for base payments, 40% for bonuses
- **Timing**: Allow sufficient time for content creation (1-2 weeks)
- **Creator Selection**: Review creator profiles and past performance
- **Clear Guidelines**: Provide detailed content requirements

#### Campaign Management
- **Prompt Reviews**: Review content within 24-48 hours
- **Fair Evaluation**: Use consistent criteria for all creators
- **Performance Tracking**: Update metrics accurately and promptly
- **Winner Selection**: Base decisions on objective performance data

### For Creators

#### Profile Optimization
- **Complete Profiles**: Fill all profile sections thoroughly
- **Quality Portfolio**: Showcase your best work
- **Niche Focus**: Specialize in specific content categories
- **Social Proof**: Link verified social media accounts

#### Campaign Participation
- **Selective Application**: Apply to campaigns matching your brand
- **Quality Content**: Prioritize quality over quantity
- **Deadline Management**: Submit content well before deadlines
- **Engagement Optimization**: Actively promote your content

### General Platform Tips

#### Security
- **Account Security**: Use strong passwords and 2FA
- **Transaction Verification**: Double-check all transaction details
- **Object ID Management**: Keep records of important object IDs
- **Backup Recovery**: Store recovery phrases securely

#### Performance Optimization
- **Gas Management**: Monitor gas prices for optimal timing
- **Batch Operations**: Group multiple actions when possible
- **Network Monitoring**: Be aware of network congestion
- **Error Handling**: Implement proper retry mechanisms

---

## Troubleshooting

### Common Issues

#### Transaction Failures
- **Insufficient Gas**: Increase gas budget
- **Invalid Permissions**: Verify account ownership
- **Timing Issues**: Check campaign phase and deadlines
- **Object Not Found**: Verify object IDs are correct

#### Payment Issues  
- **Missing Payments**: Check campaign status and requirements
- **Incorrect Amounts**: Verify CPM calculations
- **Payment Delays**: Allow time for blockchain confirmation
- **Receipt Problems**: Check event logs for payment records

#### Content Issues
- **Submission Failures**: Verify application status and timing
- **Review Delays**: Contact brand if no response after 48 hours
- **Publication Problems**: Ensure content meets approval requirements
- **Engagement Tracking**: Wait 24-48 hours before expecting metric updates

### Getting Help
- **Documentation**: Check API docs and workflow guides
- **Community**: Join Discord for peer support
- **Support**: Submit tickets for technical issues
- **Admin**: Contact platform admin for dispute resolution

---

This comprehensive workflow guide covers all aspects of using the Swans platform. For detailed API information, see [API.md](API.md). For technical implementation details, check the source code documentation.