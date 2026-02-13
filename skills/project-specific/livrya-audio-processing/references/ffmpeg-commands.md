# FFmpeg Commands Reference

Common FFmpeg commands used in Livrya audio processing.

## Basic Conversion

### Convert WAV to MP3
```bash
ffmpeg -i input.wav -codec:a libmp3lame -q:a 4 output.mp3
```

### Convert to AAC
```bash
ffmpeg -i input.wav -codec:a aac -b:a 128k output.m4a
```

### Convert to OGG/Opus
```bash
ffmpeg -i input.wav -codec:a libopus -b:a 128k output.ogg
```

## Normalization & Loudness

### Normalize to -16 LUFS (Audiobook Standard)
```bash
ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 output.mp3
```

### Get Current Loudness (JSON output)
```bash
ffmpeg -i input.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -
```

### Simple Volume Adjustment
```bash
# Increase volume 20%
ffmpeg -i input.mp3 -af volume=1.2 output.mp3

# Decrease volume 10%
ffmpeg -i input.mp3 -af volume=0.9 output.mp3
```

## Trimming & Cutting

### Trim Silence from Start & End
```bash
ffmpeg -i input.mp3 -af silenceremove=1:0:-40dB output.mp3
```

### Detect Silence
```bash
ffmpeg -i input.mp3 -af silencedetect=n=-40dB:d=0.1 -f null -
```

### Cut Specific Section (10s to 60s)
```bash
ffmpeg -i input.mp3 -ss 10 -to 60 -codec copy output.mp3
```

### Trim Last Seconds (remove trailing 5 seconds)
```bash
# First get duration
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 input.mp3

# Then trim (e.g., if duration is 300s, trim to 295s)
ffmpeg -i input.mp3 -to 295 -codec copy output.mp3
```

## Compression & Bitrate

### Encode MP3 at Different Bitrates
```bash
# 64 kbps (preview quality)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 64k output.mp3

# 128 kbps (standard quality)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k output.mp3

# 192 kbps (premium quality)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 192k output.mp3

# 320 kbps (high quality)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 320k output.mp3
```

### Quality vs Speed Trade-off (MP3)
```bash
# Fast encoding (lower quality)
ffmpeg -i input.wav -codec:a libmp3lame -q:a 8 output.mp3

# Medium (balanced)
ffmpeg -i input.wav -codec:a libmp3lame -q:a 4 output.mp3

# Slow encoding (highest quality)
ffmpeg -i input.wav -codec:a libmp3lame -q:a 0 output.mp3
```

## Metadata

### Add Metadata to MP3
```bash
ffmpeg -i input.mp3 \
  -metadata title="Chapter 1" \
  -metadata artist="Narrator Name" \
  -metadata album="Book Title" \
  -metadata date="2026" \
  -codec copy output.mp3
```

### Add Chapter Markers (MP4)
```bash
ffmpeg -i input.wav \
  -codec:a aac \
  -codec:v copy \
  -map_metadata 0 \
  output.m4a
```

## Advanced Processing

### Complete Processing Pipeline
```bash
ffmpeg -i input.wav \
  -af "silenceremove=1:0:-40dB,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -codec:a libmp3lame \
  -b:a 128k \
  -metadata title="Chapter 1" \
  output.mp3
```

### Convert with Multiple Filters
```bash
ffmpeg -i input.wav \
  -af "silenceremove=1:0:-40dB,                    # Remove silence
       loudnorm=I=-16:TP=-1.5:LRA=11,              # Normalize
       volume=0.95"                               # Slight volume reduction
  -codec:a libmp3lame \
  -q:a 4 \
  output.mp3
```

## Batch Processing

### Process Multiple Files in Bash Loop
```bash
for file in *.wav; do
  output="${file%.wav}.mp3"
  echo "Processing $file..."
  ffmpeg -i "$file" \
    -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
    -codec:a libmp3lame \
    -b:a 128k \
    -y "$output"
done
```

### Parallel Processing (GNU Parallel)
```bash
find . -name "*.wav" | parallel ffmpeg -i {} \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" \
  -codec:a libmp3lame \
  -b:a 128k \
  -y "{.}.mp3"
```

## Information & Analysis

### Get Audio Info
```bash
ffprobe -v error -show_entries format=duration,bit_rate \
  -show_entries stream=codec_name,sample_rate,channels \
  -of default=noprint_wrappers=1 input.mp3
```

### Get Duration Only
```bash
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 input.mp3
```

### Analyze for Loudness
```bash
ffmpeg -i input.mp3 \
  -af loudnorm=I=-16:print_format=summary \
  -f null -
```

### Generate Waveform (for visualization)
```bash
ffmpeg -i input.mp3 \
  -af "showwavespic=s=960x200:colors=cyan" \
  -frames:v 1 \
  waveform.png
```

## Troubleshooting Commands

### Check if File is Corrupt
```bash
ffmpeg -v error -i input.mp3 -f null -
```

### Re-encode to Fix Corruption
```bash
ffmpeg -i corrupted.mp3 \
  -codec:a libmp3lame \
  -b:a 128k \
  fixed.mp3
```

### Copy Without Re-encoding (Fast)
```bash
ffmpeg -i input.mp3 -codec copy output.mp3
```

### Convert Container Without Re-encoding
```bash
# Change from .mp3 to .m4a without re-encoding
ffmpeg -i input.mp3 -codec copy output.m4a
```

## Docker Usage

### Run FFmpeg in Docker
```dockerfile
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["ffmpeg"]
```

### Use in Node.js Container
```dockerfile
FROM node:18-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY . .
RUN npm install

CMD ["node", "index.js"]
```

## Performance Tips

1. **Use `-codec copy` when possible** - Fastest, no re-encoding
2. **Batch similar operations** - Process multiple files in parallel
3. **Use appropriate bitrates** - Don't over-encode
4. **Cache results** - Don't re-process same files
5. **Use streaming** - FFmpeg handles large files automatically
6. **Limit CPU cores** - Use `-threads 2` for mobile/shared environments

---

For full FFmpeg documentation: https://ffmpeg.org/documentation.html
