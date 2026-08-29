/*
@Developer: Abhinav Kumar
Name: Poketwo-Autocatcher
Version: V1.3.2
Description: bot to help users with catching pokemons
@Supported: poketwo/pokemon
*/
const Discord = require("discord.js-selfbot-v13");
const client = new Discord.Client({
    checkUpdate: false
});
const express = require('express');
const {
    solveHint,
    checkRarity
} = require("pokehint");

const config = require('./config.json');
const allowedChannels = []; // Add your allowed channel IDs to this array or leave it like [] if you want it to catch from all channels
let isSleeping = false;


//------------------------- KEEP-ALIVE--------------------------------//

const app = express();
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");
app.get("/", (req, res) => {
    res.status(200).send({
        success: "true"
    });
});
app.listen(process.env.PORT || 3000);

//--------------------------------------------------------------//

//-------------------------READY HANDLER+SPAMMER-----------------------//

client.on('ready', () => {
    console.log("https://github.com/abhii-3007/poketwoAC");
    console.log(`Account: ${client.user.username} is ONLINE.`);
    console.log("Note: When you're using Incense then make sure it occurs in a separate channel where hint bots like pokename/sierra aren't enabled to send messages there!");
    console.log("Use $help to know about commands");

    const channel = client.channels.cache.get(config.spamChannelID);

    function getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function spam() {
        if (!channel) return;
        const result = Math.random().toString(36).substring(2, 15);
        channel.send(result);
        const randomInterval = getRandomInterval(1500, 5000); // Random interval for spam between 1.5 seconds and 5 seconds
        setTimeout(spam, randomInterval);
    }
    spam();
});

//------------------------------------------------------------//

//-------------------------Anti-Crash-------------------------//

process.on("unhandledRejection", (reason, p) => {
    if (reason == "Error: Unable to identify that pokemon." || reason?.name === "Error [INTERACTION_COLLECTOR_ERROR]") { } else {
        console.log(" [antiCrash] :: Unhandled Rejection/Catch");
        console.log(reason, p);
    }
});
process.on("uncaughtException", (err, origin) => {
    console.log(" [antiCrash] :: Uncaught Exception/Catch");
    console.log(err, origin);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
    console.log(" [antiCrash] :: Uncaught Exception/Catch (MONITOR)");
    console.log(err, origin);
});
process.on("multipleResolves", (type, promise, reason) => {
    console.log(" [antiCrash] :: Multiple Resolves");
    console.log(type, promise, reason);
});

//------------------------------------------------------------//

//----------------------------AUTOCATCHER--------------------------------------//

client.on('messageCreate', async message => {
    // Check if channel is allowed
    if (message.author.id === "716390085896962058" || message.author.id === "854233015475109888") {
        if (allowedChannels.length > 0 && !allowedChannels.includes(message.channel.id)) return;
    }

    if (message.content === "$captcha_completed" && message.author.id === config.OwnerID) {
        isSleeping = false;
        message.channel.send("Autocatcher Started!");
    }

    if (message.content === "$help" && message.author.id === config.OwnerID) {
        await message.channel.send(
            "``` Poketwo-Autocatcher\n\n $captcha_completed : Use to restart the bot once captcha is solved\n$say <content> : Make the bot say whatever you want\n $react <messageID> : React with ✅ emoji\n $click <messageID> : Clicks the button which has ✅ emoji\n $help : To show this message ```"
        );
    }

    if (!isSleeping) {

        if (message.content.includes("Please tell us") && message.author.id === "716390085896962058") {
            isSleeping = true;
            message.channel.send("Autocatcher Stopped, Captcha Detected! Use `$captcha_completed` once the captcha is solved ");
            setTimeout(async function () {
                isSleeping = false;
            }, 18000000); // 5 hours

        } else if (message.content.startsWith("$say") && message.author.id == config.OwnerID) {
            let say = message.content.split(" ").slice(1).join(" ");
            message.channel.send(say);

        } else if (message.content.startsWith("$react") && message.author.id == config.OwnerID) {
            // (existing react command code omitted for brevity but intact)
            const args = message.content.slice(1).trim().split(/ +/g);
            if (!args[1]) {
                message.reply(`Please specify the message ID as an argument like "$react <messageID>"`);
                return;
            }
            let msg;
            try { msg = await message.channel.messages.fetch(args[1]); } catch (err) { return message.reply(`Could not find a message with that ID.`); }
            try { await msg.react("✅"); await message.react("✅"); } catch (err) { message.react("❌"); }

        } else if (message.content.startsWith("$click") && message.author.id == config.OwnerID) {
            // (existing click command code omitted for brevity but intact)
            const args = message.content.slice(1).trim().split(/ +/g);
            if (!args[1]) {
                message.reply(`Please specify the message ID as an argument like "$click <messageID>".`);
                return;
            }
            let msg;
            try { msg = await message.channel.messages.fetch(args[1]); } catch (err) { return message.reply(`Could not find a message with that ID.`); }
            try { await msg.clickButton(); await message.react("✅"); } catch (err) { message.react("❌"); }

        } else if (message.content == "That is the wrong pokémon!" && message.author.id == "716390085896962058") {
            message.channel.send(`<@716390085896962058> h`);

        } else if (message.author.id == "716390085896962058") {
            
            // 1. Detect a wild Pokemon Spawn
            if (message.embeds.length > 0 && message.embeds[0].title && message.embeds[0].title.includes("wild pokémon")) {
                
                // Wait for the helper bot (854233015475109888) to respond with "Name: XX%"
                const filter = m => m.author.id === "854233015475109888" && m.content.includes(":");
                
                try {
                    // Start listener (Times out after 4000ms / 4 seconds)
                    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 4000, errors: ['time'] });
                    const helperMsg = collected.first();
                    
                    // Parse the Pokemon name, remove formatting (like bold text **), trim spaces, make lowercase
                    const pokemonName = helperMsg.content.split(":")[0].replace(/[*_`]/g, '').trim().toLowerCase();
                    
                    console.log(`[Helper Bot] Caught via Helper! Catching ${pokemonName}`);
                    await message.channel.send(`<@716390085896962058> c ${pokemonName}`);
                    
                    // Rarity checking/logging (Same as hint method)
                    let rarity;
                    try { rarity = await checkRarity(pokemonName); } catch { rarity = "Not Found in Database"; }
                    
                    const channel6 = client.channels.cache.get(config.logChannelID);
                    if (channel6) {
                        channel6.send("[" + message.guild.name + "/#" + message.channel.name + "] " + "**__" + pokemonName + "__** " + "Rarity " + rarity);
                    }

                } catch (error) {
                    // Timeout hit - Helper bot didn't respond in time. Fallback to Hint.
                    console.log(`[Fallback] Helper Bot didn't respond. Sending hint command...`);
                    await message.channel.send(`<@716390085896962058> h`);
                }

            } else if (message?.embeds[0]?.footer?.text.includes("Spawns Remaining")) {
                await message.channel.send(`<@716390085896962058> h`);
                if ((message.embeds[0]?.footer?.text == "Incense: Active.\nSpawns Remaining: 0.")) {
                    message.channel.send(`<@716390085896962058> buy incense`);
                }

            // Existing logic to catch using hints
            } else if (message.content.includes("The pokémon is")) {
                let rarity;
                const pokemon = await solveHint(message);
                console.log(`[Hint Bot] Catching ${pokemon[0]}`);
                await message.channel.send(`<@716390085896962058> c ${pokemon[0]}`);

                console.log("[" + message.guild.name + "/#" + message.channel.name + "] " + pokemon[0]);
                try {
                    rarity = await checkRarity(`${pokemon[0]}`);
                } catch {
                    rarity = "Not Found in Database";
                }

                const channel6 = client.channels.cache.get(config.logChannelID);
                if (channel6) {
                    channel6.send("[" + message.guild.name + "/#" + message.channel.name + "] " + "**__" + pokemon[0] + "__** " + "Rarity " + rarity);
                }
            }
        }
    }
});

client.login(config.TOKEN);
