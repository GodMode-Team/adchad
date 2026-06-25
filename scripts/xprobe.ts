import { config } from 'dotenv'
config({ path: '.env.local' })
import { TwitterApi } from 'twitter-api-v2'

;(async () => {
  const x = new TwitterApi({
    appKey: process.env.X_API_KEY!, appSecret: process.env.X_API_SECRET!,
    accessToken: process.env.X_ACCESS_TOKEN!, accessSecret: process.env.X_ACCESS_SECRET!,
  })
  try {
    const t = await x.v2.tweet({ text: 'AdChad API plumbing test — ignore. ' + Math.floor(Date.now() / 1000) })
    console.log('TEXT TWEET ✅', t.data.id)
    await x.v2.deleteTweet(t.data.id)
    console.log('deleted ✅ → posting works; the 402 was MEDIA upload only')
  } catch (e: any) {
    console.log('TEXT TWEET ❌ code=', e?.code, '\n data=', JSON.stringify(e?.data)?.slice(0, 500))
  }
})()
