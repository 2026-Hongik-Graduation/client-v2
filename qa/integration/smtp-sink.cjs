// Local SMTP inbox for isolated H2 QA. Never sends external mail.
const net = require("node:net"), http = require("node:http");
const inbox = new Map();
net.createServer(socket => {
  socket.write("220 qa-local ESMTP\r\n");
  let buffer="", dataMode=false, rows=[], recipient="";
  socket.on("data",chunk=>{
    buffer+=chunk.toString("utf8");
    let pos;
    while((pos=buffer.indexOf("\n"))>=0){
      const line=buffer.slice(0,pos).replace(/\r$/,"");
      buffer=buffer.slice(pos+1);
      if(dataMode){
        if(line==="."){
          dataMode=false;
          const raw=rows.join("\n"), body=raw.split(/\r?\n\r?\n/).slice(1).join("\n");
          const decoded=/Content-Transfer-Encoding:\s*base64/i.test(raw)
            ?Buffer.from(body.replace(/\s/g,""),"base64").toString("utf8")
            :body.replace(/=\r?\n/g,"").replace(/=([0-9a-f]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
          const code=decoded.match(/\b\d{5}\b/)?.[0];
          if(recipient&&code)inbox.set(recipient,code);
          rows=[];socket.write("250 accepted\r\n");
        }else rows.push(line.startsWith("..")?line.slice(1):line);
      }else if(/^(EHLO|HELO)/i.test(line))socket.write("250 qa-local\r\n");
      else if(/^MAIL FROM:/i.test(line))socket.write("250 OK\r\n");
      else if(/^RCPT TO:/i.test(line)){recipient=line.match(/<([^>]+)>/)?.[1]?.toLowerCase()||"";socket.write("250 OK\r\n");}
      else if(/^DATA$/i.test(line)){dataMode=true;rows=[];socket.write("354 end with dot\r\n");}
      else if(/^QUIT$/i.test(line)){socket.write("221 Bye\r\n");socket.end();}
      else if(/^(RSET|NOOP)/i.test(line))socket.write("250 OK\r\n");
      else socket.write("502 unsupported\r\n");
    }
  });
}).listen(25250,"127.0.0.1",()=>console.log("QA_LOCAL_SMTP_READY"));
http.createServer((req,res)=>{
  const url=new URL(req.url,"http://127.0.0.1");
  if(url.pathname!=="/code"){res.writeHead(404);res.end();return;}
  const code=inbox.get((url.searchParams.get("email")||"").toLowerCase())||null;
  res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify({received:!!code,code}));
}).listen(31080,"127.0.0.1",()=>console.log("QA_LOCAL_INBOX_READY"));
