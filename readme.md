## How to use

> **Warning** this bot is a kind of _I don't know how is it working but it does_. I made it in a few hours for testing purposes and personal use but it also support multiple servers (How many? No idea).

### [Invite to your server](https://discord.com/api/oauth2/authorize?client_id=820379538499436615&permissions=8&scope=bot)

First step is to [invite the bot to your server](https://discord.com/api/oauth2/authorize?client_id=820379538499436615&permissions=8&scope=bot).

### Configure

1. Set the **trigger channel**: the one that when you join you get redirected to a new voice channel.

```
ark! set criador <voice-channel-id-trigger>
```

<kbd><img src="https://user-images.githubusercontent.com/51419598/191325652-255d8ed5-a249-47e2-b9f3-468ae5295e8e.png"></kbd>

2. Set the category scope: where you want the new voice channels should be created.

```
ark! set criador.categoria <category-id>
```

<kbd><img src="https://user-images.githubusercontent.com/51419598/191325512-672ed04e-7679-44b0-85bf-47760f41a855.png"></kbd>

3. (Optional) If you want you can customize the channel name template:

```
ark! set criador.template Hey, {name}
```

<kbd><img src="https://user-images.githubusercontent.com/51419598/191325573-ad1b58f3-708f-44c4-9cf4-2a520f66295c.png"></kbd>

4. Enjoy: now when you enter the trigger channel the bot will create a new voice channel with your name and will redirect you to there.

<kbd><img src="https://user-images.githubusercontent.com/51419598/191327019-e5e71bd5-6a15-4c49-9a9f-534b7943552f.gif"></kbd>

### How to get ID's

You can get your trigger channel ID the category ID (respectively) by:

<kbd><img src="https://user-images.githubusercontent.com/51419598/191327694-6bfc772e-4a80-4e20-a365-5fecc8b9e91b.gif"></kbd>
