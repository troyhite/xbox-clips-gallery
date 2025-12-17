# Azure Video Indexer Custom Model Training Guide for Gaming Content

This guide will help you train custom models in Azure Video Indexer to improve detection accuracy for your specific Xbox game clips.

## Prerequisites

- Access to [Azure Video Indexer Portal](https://www.videoindexer.ai/)
- Video Indexer account with Contributor permissions
- Sample game clips for training

## 1. Custom Vision Models

Train Video Indexer to recognize game-specific visual elements.

### What to Train:
- **Game UI Elements**: Health bars, ammo counters, minimaps, scoreboards
- **Character Models**: Specific characters or avatars from your games
- **Game Events**: Visual cues for kills, deaths, power-ups, achievements
- **Map Locations**: Recognizable areas or landmarks in game maps
- **Victory/Defeat Screens**: End-game result screens

### Steps to Create Custom Vision Model:

1. **Navigate to Custom Models**
   - Go to [Video Indexer Portal](https://www.videoindexer.ai/)
   - Click your account name → **Content model customization**
   - Select **Vision** tab

2. **Create New Model**
   - Click **+ New model**
   - Name it (e.g., "Call of Duty UI Elements", "Halo Characters")
   - Choose **Object detection** or **Scene classification**

3. **Upload Training Images**
   - Extract frames from your Xbox clips showing the elements you want to detect
   - You need at least 15-20 images per object/scene
   - Use diverse angles, lighting, and contexts

4. **Label Your Images**
   - Draw bounding boxes around objects (for object detection)
   - Or assign scene labels (for scene classification)
   - Be consistent with labeling

5. **Train the Model**
   - Click **Train**
   - Training takes 15-30 minutes
   - You'll receive an email when complete

6. **Test and Iterate**
   - Upload a test video using your custom model
   - Review detection accuracy
   - Add more training images for poorly detected items
   - Retrain as needed

### Pro Tips:
- **Start Small**: Train one specific game or one type of element at a time
- **Quality Over Quantity**: 50 well-labeled images beat 200 poorly labeled ones
- **Diverse Data**: Include different maps, game modes, and lighting conditions
- **Regular Updates**: Retrain models when games get visual updates/patches

## 2. Custom Keywords and Topics

Improve audio transcription and topic detection for gaming terminology.

### What to Add:
- Game titles (e.g., "Call of Duty", "Halo Infinite", "Forza Horizon")
- Character names (e.g., "Master Chief", "Cortana", "Marcus Fenix")
- Weapon names (e.g., "Battle Rifle", "Needler", "DMR")
- Game modes (e.g., "Team Deathmatch", "Capture the Flag", "Battle Royale")
- In-game locations (e.g., "Sanctuary", "Blood Gulch", "The Pit")
- Gaming terminology (e.g., "headshot", "killstreak", "respawn", "clutch")

### Steps to Create Custom Language Model:

1. **Navigate to Language Models**
   - Content model customization → **Language** tab
   - Click **+ New model**

2. **Create Keywords List**
   - Prepare a text file with one keyword/phrase per line
   - Example format:
     ```
     Master Chief
     Battle Rifle
     Capture the Flag
     UNSC
     Covenant
     Energy Sword
     Warthog
     Scorpion Tank
     ```

3. **Upload and Train**
   - Upload your keywords file
   - Name your model (e.g., "Halo Vocabulary")
   - Click **Train**

4. **Use in Analysis**
   - Select this language model when uploading videos
   - Or set as default for your account

## 3. Custom Brands Model

Detect game-specific logos, brands, and sponsors.

### What to Add:
- Game publisher logos (Xbox, Activision, 343 Industries)
- In-game fictional brands
- Sponsor logos that appear in racing games
- Studio logos in opening sequences

### Steps:

1. **Navigate to Brands**
   - Content model customization → **Brands** tab
   - Click **+ Add brand**

2. **Configure Brand**
   - Brand name
   - Optional: Website URL
   - Upload reference images/logos
   - Add variations/alternate spellings

3. **Enable Brand Detection**
   - Ensure "Brands" insight is enabled when uploading videos

## 4. Optimizing Insights for Gaming

When analyzing videos, focus on insights most relevant to gaming content.

### Recommended Insights to Enable:

```typescript
// In your Video Indexer API call
{
  "insights": [
    "Scenes",              // Scene changes for different game moments
    "Shots",               // Shot detection for highlights
    "Keyframes",           // Extract important frames
    "OCR",                 // Read game UI text, scores, timers
    "Labels",              // Detect weapons, vehicles, characters
    "AudioEffectsDetection", // Detect gunfire, explosions, sounds
    "Emotions",            // Detect player reactions in commentary
    "Topics"               // Identify discussed topics
  ]
}
```

### Insights to Consider Disabling:
- **Face detection**: Usually not relevant for gameplay
- **Celebrity recognition**: Rarely applicable
- **Transcript alignment**: Unless commentary is important

## 5. Game-Specific Training Examples

### First-Person Shooter (CoD, Halo, Battlefield)

**Train for:**
- Kill notifications ("+100 Kill", "Double Kill")
- Weapon icons in HUD
- Score/kill-death ratio displays
- Objective markers
- Hit markers

**Keywords:**
- Weapon names, perks, streaks
- Game modes
- Map names
- Military terminology

### Racing Games (Forza, Gran Turismo)

**Train for:**
- Position indicators (1st, 2nd, 3rd)
- Speed gauges
- Lap counters
- Car manufacturer logos

**Keywords:**
- Car models
- Track names
- Racing terminology (pit stop, oversteer, apex)

### Battle Royale (PUBG, Fortnite style)

**Train for:**
- Player count indicators
- Safe zone markers
- Loot rarity colors
- Elimination feeds
- Victory screens

**Keywords:**
- Weapon/item names
- Location names
- Storm/circle terminology

## 6. Testing Your Custom Models

1. **Upload Test Clips**
   - Select 5-10 diverse clips from your library
   - Analyze with custom models enabled
   - Review insights for accuracy

2. **Measure Improvements**
   - Compare detection rates before/after custom models
   - Check false positive/negative rates
   - Verify terminology is correctly recognized

3. **Iterate**
   - Identify missed detections
   - Add more training data for weak areas
   - Retrain models every 2-3 months

## 7. Production Integration

Once your models are trained and tested, update your app to use them by default:

### In Video Indexer API Calls:

```typescript
// Specify custom models in your API request
{
  "customModelId": "your-custom-vision-model-id",
  "languageModelId": "your-custom-language-model-id",
  "brandsModelId": "your-custom-brands-model-id"
}
```

### Setting Account Defaults:

1. Go to Video Indexer Portal
2. Account settings → **Default models**
3. Select your custom models as defaults
4. All future uploads will use these models automatically

## 8. Best Practices

✅ **Do:**
- Start with high-quality training data
- Test models before production use
- Document what each model is trained for
- Version your models (e.g., "Halo_v1", "Halo_v2")
- Retrain when games update
- Use consistent labeling conventions

❌ **Don't:**
- Mix multiple games in one model (train separately)
- Use low-resolution or blurry training images
- Rely solely on custom models (combine with standard AI)
- Forget to test on diverse clips
- Train with copyrighted material you don't own

## 9. Example Training Data Collection

### Script to Extract Training Frames:

```bash
# Using ffmpeg to extract frames from a video
ffmpeg -i "gameplay_clip.mp4" -vf "fps=1" frame_%04d.png

# Extract frames at specific moments
ffmpeg -i "gameplay_clip.mp4" -ss 00:00:10 -vframes 1 kill_event_01.png
ffmpeg -i "gameplay_clip.mp4" -ss 00:00:23 -vframes 1 kill_event_02.png
```

### Organizing Training Data:

```
training_data/
├── ui_elements/
│   ├── health_bar/
│   │   ├── health_100.png
│   │   ├── health_50.png
│   │   └── health_critical.png
│   ├── ammo_counter/
│   └── minimap/
├── characters/
│   ├── master_chief/
│   └── elite/
├── weapons/
│   ├── battle_rifle/
│   └── energy_sword/
└── events/
    ├── kill_notifications/
    ├── objective_complete/
    └── victory_screen/
```

## 10. Monitoring and Maintenance

- **Review Monthly**: Check detection accuracy on new clips
- **Update Quarterly**: Retrain models with new game content
- **Track Metrics**: Monitor how often custom objects are detected
- **Gather Feedback**: Note when detections are wrong or missing

## Resources

- [Video Indexer Custom Vision Documentation](https://learn.microsoft.com/azure/azure-video-indexer/customize-content-models-overview)
- [Azure Video Indexer API Reference](https://api-portal.videoindexer.ai/)
- [Computer Vision Best Practices](https://learn.microsoft.com/azure/cognitive-services/computer-vision/overview)

---

## Need Help?

If you encounter issues:
1. Check Video Indexer portal for model training status
2. Review the [troubleshooting guide](https://learn.microsoft.com/azure/azure-video-indexer/video-indexer-troubleshooting)
3. Verify your training data meets minimum requirements
4. Test with a smaller, simpler model first
