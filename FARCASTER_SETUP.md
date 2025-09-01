# Farcaster MiniApp Setup Instructions

This document provides instructions for configuring your Farcaster MiniApp manifest file.

## Overview

A `farcaster.json` file has been created at `public/.well-known/farcaster.json` to enable your onchain chatbot to function as a Farcaster MiniApp.

## Required Configuration Steps

### 1. Update Domain References

Replace all instances of `yourdomain.com` in the `farcaster.json` file with your actual domain:

```json
{
  "miniapp": {
    "iconUrl": "https://YOUR_ACTUAL_DOMAIN.com/favicon.ico",
    "homeUrl": "https://YOUR_ACTUAL_DOMAIN.com/",
    "imageUrl": "https://YOUR_ACTUAL_DOMAIN.com/opengraph-image.png",
    "splashImageUrl": "https://YOUR_ACTUAL_DOMAIN.com/favicon.ico",
    "webhookUrl": "https://YOUR_ACTUAL_DOMAIN.com/api/webhook"
  }
}
```

### 2. Generate Account Association

The `accountAssociation` section currently contains placeholders that need to be replaced with actual values:

```json
{
  "accountAssociation": {
    "header": "PLACEHOLDER_HEADER_TO_BE_REPLACED",
    "payload": "PLACEHOLDER_PAYLOAD_TO_BE_REPLACED", 
    "signature": "PLACEHOLDER_SIGNATURE_TO_BE_REPLACED"
  }
}
```

**To generate these values:**

1. Visit the [Farcaster Developer Tools](https://miniapps.farcaster.xyz/docs/guides/publishing)
2. Use your Farcaster custody address to sign a JSON Farcaster Signature (JFS)
3. The signature proves you own the domain where the MiniApp is hosted
4. Replace the placeholder values with the generated header, payload, and signature

**Alternative: Use Hosted Manifest**
- Consider using Farcaster's hosted manifest feature to manage your MiniApp details without redeploying
- This simplifies the account association process

### 3. Customize MiniApp Metadata

Update the `miniapp` section to match your application:

- **name**: "Onchain Chatbot" (or your preferred name)
- **buttonTitle**: "🤖 Chat" (or your preferred button text)
- **splashBackgroundColor**: "#000000" (or your brand color)
- **iconUrl**: Ensure this points to a publicly accessible icon
- **imageUrl**: Should point to your app's Open Graph image

### 4. Set Up Webhook (Optional)

If you want to receive webhook notifications from Farcaster:

1. Create an API endpoint at `/api/webhook` in your Next.js app
2. Update the `webhookUrl` in the manifest to point to this endpoint

### 5. Verification

After configuration:

1. Ensure your domain is accessible via HTTPS
2. Verify the manifest is accessible at: `https://yourdomain.com/.well-known/farcaster.json`
3. Validate JSON syntax using tools like JSONLint
4. Test your MiniApp loads without console errors

## File Structure

```
public/
├── .well-known/
    └── farcaster.json
```

## Resources

- [Farcaster MiniApps Documentation](https://miniapps.farcaster.xyz/docs)
- [MiniApp Specification](https://miniapps.farcaster.xyz/docs/specification)
- [Publishing Guide](https://miniapps.farcaster.xyz/docs/guides/publishing)
- [Developer Tools](https://miniapps.farcaster.xyz/docs/guides/publishing)

## Farcaster MiniApp Metadata

In addition to the `farcaster.json` manifest, HTML metadata has been added to your pages:

### Pages with Farcaster Metadata

1. **Root Layout** (`app/layout.tsx`):
   - Global Open Graph and Twitter Card metadata
   - Root-level Farcaster MiniApp metadata with "Start Chat" button

2. **Main Chat Page** (`app/(chat)/page.tsx`):
   - Page-specific metadata for the main chat interface
   - Farcaster embed with "Start Chat" action

3. **Individual Chat Pages** (`app/(chat)/chat/[id]/page.tsx`):
   - Dynamic metadata based on chat title
   - Farcaster embed with "Continue Chat" action
   - Specific URL pointing to the individual chat

### Metadata Structure

Each page includes the `fc:miniapp` meta tag with the following structure:

```html
<meta name="fc:miniapp" content='{
  "version": "1",
  "imageUrl": "https://yourdomain.com/opengraph-image.png",
  "button": {
    "title": "🤖 Start Chat",
    "action": {
      "type": "launch_frame",
      "name": "Onchain Chatbot",
      "url": "https://yourdomain.com"
    }
  }
}' />
```

### Open Graph Image

The Open Graph image has been copied to `public/opengraph-image.png` to ensure it's accessible at the root URL path for Farcaster embeds.

## Next Steps

1. Deploy your application to get a stable domain
2. Update all domain references in `farcaster.json` **and page metadata**
3. Generate proper account association signatures
4. Test Farcaster embeds by sharing your pages in Farcaster clients
5. Submit your MiniApp for review (if required)

## Testing Your Integration

After deployment:

1. Share your homepage URL in a Farcaster client
2. Verify the embed shows your app name, image, and "Start Chat" button
3. Test that clicking the button launches your MiniApp correctly
4. Share individual chat URLs to test the "Continue Chat" functionality
