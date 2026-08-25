/*
@Developer: Abhinav Kumar
Name: Poketwo-Autocatcher
Version: V1.3.2
Description: bot to help users with catching pokemons
@Supported: poketwo/pokemon
*/
const Discord = require("discord.js-selfbot-v13")
const client = new Discord.Client({
    checkUpdate: false
});
const express = require('express');
const {
    solveHint,
    checkRarity
} = require("pokehint")

const config = require('./config.json')
const json = require('./namefix.json');
const allowedChannels = []; // Add your allowed channel IDs to this array or leave it like [] if you want to it to catch from all channels
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

//-------------------------SOME EXTRA FUNCTIONS----------------------------//

function findOutput(input) {
    if (json.hasOwnProperty(input)) {
        return json[input];
    } else {
        return input;
    }
}

function checkSpawnsRemaining(string) {
    const match = string.match(/Spawns Remaining: (\d+)/);
    if (match) {
        const spawnsRemaining = parseInt(match[1]);
        console.log(spawnsRemaining)
    }
}
//--------------------------------------------------------------------------//

//-------------------------READY HANDLER+SPAMMER-----------------------//

client.on('ready', () => {
    console.log("https://github.com/abhii-3007/poketwoAC")
    console.log(`Acount: ${client.user.username} is ONLINE, `)
    console.log("Note: When your using Incense then make sure it occurs in a separate channel where hint bots like pokename/sierra aren't enabled to send message there!")
    console.log("Use $help to know about commands")

    const channel = client.channels.cache.get(config.spamChannelID)

    function getRandomInterval(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function spam() {
        const result = Math.random().toString(36).substring(2, 15);
        channel.send(result)
        const randomInterval = getRandomInterval(1500, 5000); // Random interval for spam between 1 second and 5 seconds
        setTimeout(spam, randomInterval);
    }
    spam();
})

//------------------------------------------------------------//


//-------------------------Anti-Crash-------------------------//

process.on("unhandledRejection", (reason, p) => {
    if (reason == "Error: Unable to identify that pokemon.") { } else {
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
    if (message.content === "$captcha_completed" && message.author.id === config.OwnerID) {
        isSleeping = false;
        message.channel.send("Autocatcher Started!")
    }

    if (message.content === "$help" && message.author.id === config.OwnerID) {
        await message.channel.send(
            "``` Poketwo-Autocatcher\n\n $captcha_completed : Use to restart the bot once captcha is solved\n $say <content> : Make the bot say whatever you want\n $react <messageID> : React with ✅ emoji\n $click <messageID> : Clicks the button which has ✅ emoji\n $help : To show this message ```"
        )
    }

    if (!isSleeping) {

        if (message.content.includes("Please tell us") && message.author.id === "716390085896962058") {
            isSleeping = true;
            message.channel.send("Autocatcher Stopped , Captcha Detected! Use `$captcha_completed` once the captcha is solved ");
            setTimeout(async function () {
                isSleeping = false
            }, 18000000) //5 hours

        } else if (message.content.startsWith("$say") && message.author.id == config.OwnerID) {
            let say = message.content.split(" ").slice(1).join(" ")
            message.channel.send(say)

        } else if (message.content.startsWith("$react") && message.author.id == config.OwnerID) {
            const args = message.content.slice(1).trim().split(/ +/g)
            if (!args[1]) {
                message.reply(`Please specify the message ID as an argument like "$react <messageID>"`)
                return;
            }

            let msg;
            try {
                msg = await message.channel.messages.fetch(args[1])
            } catch (err) {
                message.reply(`Could not find a message with that ID.`)
                console.log(err)
                return;
            }

            try {
                await msg.react("✅")
                await message.react("✅")
            } catch (err) {
                message.react("❌")
                console.log(err)
            }

        } else if (message.content.startsWith("$click") && message.author.id == config.OwnerID) {
            const args = message.content.slice(1).trim().split(/ +/g)
            if (!args[1]) {
                message.reply(`Please specify the message ID as an argument like "$click <messageID>".`)
                return;
            }

            let msg;
            try {
                msg = await message.channel.messages.fetch(args[1])
            } catch (err) {
                message.reply(`Could not find a message with that ID.`)
                console.log(err)
                return;
            }

            try {
                await msg.clickButton();
                await message.react("✅")
            } catch (err) {
                message.react("❌")
                console.log(err)
            }

        } else if (message.content == "That is the wrong pokémon!" && message.author.id == "716390085896962058") {
            message.channel.send(`<@716390085896962058> h`)

        } else if (message.author.id == "716390085896962058") {
            if (message?.embeds[0]?.footer?.text.includes("Spawns Remaining")) {
                await message.channel.send(`<@716390085896962058> h`)
                if ((message.embeds[0]?.footer?.text == "Incense: Active.\nSpawns Remaining: 0.")) {
                    message.channel.send(`<@716390085896962058> buy incense`)
                }

            } else if (message.content.includes("The pokémon is")) {
                let rarity;
                const pokemon = await solveHint(message)
                console.log(`Catching ${pokemon[0]}`)
                await message.channel.send(`<@716390085896962058> c ${pokemon[0]}`)

                console.log("[" + message.guild.name + "/#" + message.channel.name + "] " + pokemon[0])
                try {
                    rarity = await checkRarity(`${pokemon[0]}`)
                } catch {
                    rarity = "Not Found in Database";
                }

                const channel6 = client.channels.cache.get(config.logChannelID)
                channel6.send("[" + message.guild.name + "/#" + message.channel.name + "] " + "**__" + pokemon[0] + "__** " + "Rarity " + rarity)
            }

        } else {
            const Pokebots = ["696161886734909481", "874910942490677270"]; //sierra ,pokename
            if (allowedChannels.length > 0 && !allowedChannels.includes(message.channel.id)) {
                return;
            }
            if (Pokebots.includes(message.author.id)) {
                // OCR-based image spawn handling removed.
                // No fallback exists here now for image-only spawns; this branch
                // is intentionally left empty since it depended entirely on OCR.
            }
        }
    }
})
client.login(config.TOKEN) //use process.env.TOKEN if you are using it in repl.it