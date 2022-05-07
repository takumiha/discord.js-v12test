const http = require("http");
const querystring = require("querystring");
const discord = require("discord.js");
require("discord-replys");//discord-replysを入れないときはこの行を消す
const client = new discord.Client(); 

http
  .createServer(function (req, res) {
    if (req.method == "POST") {
      var data = "";
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        if (!data) {
          console.log("No post data");
          res.end();
          return;
        }
        var dataObject = querystring.parse(data);
        console.log("post:" + dataObject.type);
        if (dataObject.type == "wake") {
          console.log("Woke up in post");
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Discord Bot is active now\n");
    }
  })
  .listen(3000);

client.on("ready", (message) => {
  console.log("Bot準備完了");
  setInterval(() => {
     client.user.setActivity({
     //この場合ping:(ping ms)で(botが参加してるサーバー数)鯖を視聴中となる
       name: `ping:${client.ws.ping}msで${client.guilds.cache.size}鯖`,　type: 'WATCHING'
     })
   }, 10000//←10000ミリ秒(=10秒)おきに情報の取得と更新をする
)});

client.on("message", (message) => {
  //botに反応しない
  if (message.author.bot) return;
  if (message.author.id == client.user.id) {
    return;
  }
  
  //メンションあり　キーワード(含む)
  //メンションするとリプライしてくる
  if (message.mentions.users.has(client.user.id)) {
    sendReply(message, "message");
    return;
  }
  
  //この場合keywordを含む送信するとbotがリプライしながらmessageと送信してくる
  if (message.content.match(/keyword/)) {
    sendReply(message, "message");
    return;
  }
  
  //キーワード(含む)
  //keywordを含む文章を送信するとmessageが送信される
  if (message.content.match(/keyword/)) {
    let text = "message";
    sendMsg(message, text);
    return;
  }
  
  //keyword1かkeyword2が含まれている文章を送信するとメッセージが送信される |を使うことで複数指定可能
  if (message.content.match(/keyword1|keyword2/)) {
    let text = "message";
    sendMsg(message, text);
    return;
  }
  
  //キーワード(正確)
   //keywordのみが送信されたときにだけmessageを送信
  if (message.content === "keyword") {
    let text = "message";
    sendMsg(message, text);
    return;
  }
  
  //確率　キーワード含む
  //キーワードが送信されるとmessage1かmessage2でそれぞれに分配された比率で反応
      //先ほど同様、|を使うことで複数指定したり、.matchを === にすることでワードの限定が可能
        //===にする際は(//)を""にするのを忘れずに
  if (message.content.match(/キーワード/)){
    let arr = ["message1", "message2"];
    let weight = [ 65,  35];
    lotteryByWeight(message, arr, weight);
    return;
  } 
  
  //コマンド　確率
   //原理は先ほど同様 
  if (message.content === "!omikuji"){
    let arr = ["吉", "凶",  "中吉", "小吉", "大吉", "大凶"];
    let weight = [ 25, 25, 20, 15, 10, 5];
    lotteryByWeight(message, arr, weight);  
    return;
  }
  
  //ファイル添付
   //filesを添付することが可能　
      //glitchを使う場合assetsにファイルをアップしそこからリンクを持てくるといい
      //この場合、imageと打つとhttps;//nnn.tt/image.pngに該当する写真を送信する
  if (message.content === "image") {
    let files = "https://nnn.tt/image.png";
    sendfile(message, files);
    return;
    }
  
  //vc 接続と切断
  //!joinと打つと接続する
  if (message.content === "!join" && message.member.voice.channel){
      message.member.voice.channel.join()
       .then(message.channel.send("@here 通話しよ"))
       .catch(console.log("ボイスチャンネル接続"))
    return;
    }
  
  //!dcと打つと切断する
   if (message.content === "!dc" && message.member.voice.channel){
      message.member.voice.channel.leave()
      message.channel.send("バイバーイ")
       .then(console.log("ボイスチャンネルから切断"))
    return;
    }
  //vc voicestart式
  //!p testと打つとhttps://nnn.tt/test.mp3が接続してるvcで再生される
   if (message.content === "!p test" && message.member.voice.channel)
    {
      let voice = `https://nnn.tt/test.mp3`
      voicestart(message, voice);
      return;
    }
  
  //vc randomvoice
  //!pと打つとhttps://nnn.tt/test1.mp3,https://nnn.tt/test2.mp3,https://nnn.tt/test3.mp3のいずれかが再生
  //どれがどれくらいの確率で流れるかはweightで確率メッセージの時同様調整可能
   if (message.content === "!p" && message.member.voice.channel)
    {
      let arr = ["https://nnn.tt/test1.mp3", "https://nnn.tt/test2.mp3", "https://nnn.tt/test3.mp3"];
      let weight = [10, 10, 10];
      randomvoice(message, arr, weight);
      console.log("ランダムボイス再生");
      return;
    }
  //vc autostop式
  //未完成
  });


client.on('messageCreate', async message => {
   if (message.content.startsWith('!members') && message.guild) {
   	if (message.mentions.members.size !== 1) return message.channel.send('メンバーを1人指定してください')
     const member = message.mentions.members.first()
     if (!member.voice.channel) return message.channel.send('指定したメンバーがボイスチャンネルに参加していません')
     const tags = member.voice.channel.members.map(member => member.user.tag)
     message.channel.send(tags.join('\n'))
   }
 })

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);

//メンション用function
function sendReply(message, text) {
  message
    .reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

//メッセージ用function
function sendMsg(message, text, option = {}) {
  message
    .channel
    .send(text)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

//ファイル用function
function sendfile(message, files, option = {}) {
  message
    .channel
    .send({files: [files]})
    .then(console.log("ファイル送信: " + files + JSON.stringify(option)))
    .catch(console.error);
}

//確率用function
function lotteryByWeight(message, arr, weight){
  let totalWeight = 0;
  for (var i = 0; i < weight.length; i++){
    totalWeight += weight[i];
  }
  let random = Math.floor(Math.random() * totalWeight);
  for (var i = 0; i < weight.length; i++){
    if (random < weight[i]){
      sendMsg(message, arr[i]);
      return;
    }else{
      random -= weight[i];
    }
  }
  console.log("lottery error");
}

//サウンド用function
　//voicestart式
function voicestart(message, voice) {
  message
    .member.voice.channel
    .join()
    .then( connection => {
            const dispatcher = connection.play(voice);
            dispatcher.on;
        })
        .catch(console.log("サウンド再生 :" + voice));
}

 //randomvoice式
function  randomvoice(message, arr, weight) {
  let totalWeight = 0;
  for (var i = 0; i < weight.length; i++){
    totalWeight += weight[i];
  }
  let random = Math.floor(Math.random() * totalWeight);
  for (var i = 0; i < weight.length; i++){
    if (random < weight[i]){
      voicestart(message, arr[i]);
      return;
    }else{
      random -= weight[i];
    }
  }
  console.log("ランダムボイス再生");
}  
 //autoleave式 (未完成)
