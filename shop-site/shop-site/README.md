# সেরা ডিল: মাল্টি-পেজ অ্যাফিলিয়েট সাইট

প্রতিটি প্রোডাক্ট, কোর্স, ক্যাটাগরি ও ব্লগের আলাদা URL ও আলাদা SEO পেজ তৈরি হয় (static site)। সার্ভার বা ডাটাবেস লাগে না।

## অনলাইন করা (Netlify, ফ্রি)
1. এই ফোল্ডারের সব ফাইল একটি GitHub রিপোজিটরিতে আপলোড করুন।
2. Netlify > Add new site > Import from Git। সেটিংস `netlify.toml` থেকে নিজে আসবে (Build command: `node build.js`, Publish directory: `dist`)।
3. `data/settings.json`-এ `siteUrl` নিজের আসল ঠিকানা দিন, নইলে canonical ও sitemap ভুল হবে।

## অ্যাডমিন প্যানেল (`/admin`)
1. `admin/config.yml`-এ `YOUR-GITHUB-USER/YOUR-REPO` বদলান।
2. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App। Callback URL: `https://api.netlify.com/auth/done`
3. Netlify > Site configuration > Access & security > OAuth > Install provider (GitHub), Client ID ও Secret বসান।
4. `আপনার-সাইট/admin`-এ GitHub দিয়ে লগইন করুন।

সেভ করলে Netlify নিজে সাইট রিবিল্ড করে (১–২ মিনিট)। এখান থেকে নিয়ন্ত্রণ করা যায়: নোটিশ বার, ব্যানার, ফ্ল্যাশ সেল ও টাইমার, ক্যাটাগরি, প্রোডাক্ট, কোর্স, ব্লগ, স্ট্যাটিক পেজ।

## নিজের তথ্য বসান (জরুরি)
- সব প্রোডাক্ট ও কোর্সের `link`-এ নিজের অ্যাফিলিয়েট লিংক দিন। সাইটে লিংকগুলো `/go/p/...` আকারে দেখায়, এগুলো ক্লিক ট্র্যাক ও লিংক বদলানো সহজ করে।
- নমুনা প্রোডাক্টের ছবি, দাম, রেটিং, স্পেসিফিকেশন আসল তথ্য দিয়ে বদলান। বিক্রেতার ছবি অনুমতি ছাড়া ব্যবহার করবেন না, অ্যাফিলিয়েট প্রোগ্রামের দেওয়া ক্রিয়েটিভ বা নিজের তোলা ছবি ব্যবহার করুন।
- রেটিং শুধু আসল সংখ্যা দিন। বানানো রেটিং বা রিভিউ Google ও ক্রেতা দুজনের কাছেই ক্ষতিকর।
- Google Search Console-এ সাইট যোগ করে `sitemap.xml` জমা দিন।

## ফাইল কাঠামো
- `data/*.json`: সব কনটেন্ট
- `build.js`: পেজ জেনারেটর (Node.js, কোনো প্যাকেজ লাগে না)
- `assets/`: CSS, JS, ছবি
- লোকালে দেখতে: `node build.js` চালিয়ে `dist` ফোল্ডার যেকোনো স্ট্যাটিক সার্ভারে খুলুন।
