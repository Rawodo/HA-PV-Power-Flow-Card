
class PVPowerFlowCard extends HTMLElement {

    config;
    content;
    entName=["PV","Battery","Battery-Capacity","Grid"];
    
    pvPower;batPower;batCapacity;gridPower;
    loadPower;
    pvPowerStr; batPowerStr; batCapacityStr; gridPowerStr; loadPowerStr;

    canvas; ctx;
    flowOffsetX; flowOffsetY;
    flowWidth; flowHeight;
    ld=10; //line-distance
    circleDiameter=70; //Durchmesser der Kreise

    pos_PV_Load=0;
    pos_PV_Grid=0;
    pos_PV_Bat=0;
    pos_Bat_Grid=0;
    pos_Bat_Load=0;
    pos_Grid_Load=0;

    

    setConfig(config) {
        if (!config.entities) {
            throw new Error('Please define entities!');
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    set hass(hass) {

        // done once
        if (!this.content) {
            //console.log("set hass once: ",this);
            this.innerHTML = `
                <div>
                  <ha-card header="${hass.user.name}'s PV-Anlage">
                    <canvas id="PF_CVG" style="width:100%; height:100%">
                    </canvas>
                  </ha-card>
                </div>
            `;
            this.content = [1,2,3,4];
            //console.log("set hass once content: ",this.content);
            this.canvas=this.querySelector('canvas');
            this.canvas.width=300;
            this.canvas.height=300;
            this.flowOffsetX=100;
            this.flowOffsetY=100;
            this.flowWidth=100;
            this.flowHeight=100;
            this.ctx = this.canvas.getContext("2d");
            this.ctx.scale(1.0,1.0);
            this.timer=setInterval(this.renderCanvas.bind(this),25);
            //console.log("set hass once thiscanvas: ",this.canvas);
        }
        // done repeatedly
        this.content.forEach(function(ent,indx) {
              const entityId = this.config.entities[indx];
              const state = hass.states[entityId];
              if (indx==0) this.pvPower=(state)?state.state:undefined;
              if (indx==1) this.batPower=(state)?state.state:undefined;
              if (indx==2) this.batCapacity=(state)?state.state:undefined;
              if (indx==3) this.gridPower=(state)?state.state:undefined;
            },this);
        this.calcValues();
        this.renderCanvas();
    }

    static getStubConfig() {
        return { entities: ["input_number.pv", 
                            "input_number.batterie_ladung", 
                            "input_number.batterie_ladezustand", 
                            "input_number.meter"] 
               }
    }

    calcValues() {
        this.loadPower=this.pvPower-this.gridPower-(this.batPower||0);
        this.loadPowerStr=ToString(this.loadPower,3,3);
        this.pvPowerStr=ToString(this.pvPower,3,3);
        this.gridPowerStr=ToString(Math.abs(this.gridPower),3,3);
        if (this.batPower!=undefined) {
            this.batPowerStr=ToString(Math.abs(this.batPower),3,3);
            this.batCapacityStr=ToString(this.batCapacity,0,0);
        }
    }

    renderCanvas() {
        this.clearCanvas(this.canvas,this.ctx);
        this.renderCircle(this.ctx,this.flowOffsetX+this.flowWidth/2,this.flowOffsetY-this.circleDiameter/2,this.circleDiameter,"orange");
        this.renderCircleName(this.ctx,"PV",this.flowOffsetX+this.flowWidth/2,this.flowOffsetY-this.circleDiameter-5);
        this.renderCircleValue(this.ctx,this.pvPowerStr,this.flowOffsetX+this.flowWidth/2,this.flowOffsetY-this.circleDiameter/2);
        this.renderCircle(this.ctx,this.flowOffsetX+this.flowWidth/2,this.flowOffsetY+this.flowHeight+this.circleDiameter/2,this.circleDiameter,"blue");
        this.renderCircleName(this.ctx,"Load",this.flowOffsetX+this.flowWidth/2,this.flowOffsetY+this.flowHeight+this.circleDiameter+15+5);
        this.renderCircleValue(this.ctx,this.loadPowerStr,this.flowOffsetX+this.flowWidth/2,this.flowOffsetY+this.flowHeight+this.circleDiameter/2);
        if (this.batPower!=undefined) {
            this.renderCircle(this.ctx,this.flowOffsetX-this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2,this.circleDiameter,"green");
            this.renderCircleName(this.ctx,"Battery",this.flowOffsetX-this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2+this.circleDiameter/2+15+5);
            this.renderCircleValue(this.ctx,this.batPowerStr,this.flowOffsetX-this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2);
            this.renderBatteryImage(this.ctx,this.flowOffsetX-this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2,this.circleDiameter);
            this.renderBatteryCapacity(this.ctx,this.batCapacityStr,this.flowOffsetX-this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2,this.circleDiameter);
        }
        this.renderCircle(this.ctx,this.flowOffsetX+this.flowWidth+this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2,this.circleDiameter,"gray");
        this.renderCircleName(this.ctx,"Grid",this.flowOffsetX+this.flowWidth+this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2+this.circleDiameter/2+15+5);
        this.renderCircleValue(this.ctx,this.gridPowerStr,this.flowOffsetX+this.flowWidth+this.circleDiameter/2,this.flowOffsetY+this.flowHeight/2);

        // für jede Linie die einzelnen Power-Werte berechnen
        var ppl=0, ppb=0, ppg=0, pbg=0, pbl=0, pgl=0;
        var p;
        // PV
        p=this.pvPower;
        if (p>0) {ppl=Math.min(p,this.loadPower).toFixed(3)*1; p=p-ppl;} //Power zur Last
        if (p>0) if ((this.batPower||0)>0) {ppb=Math.min(p,(this.batPower||0)).toFixed(3)*1; p=p-ppb;} //Power zur Batterie
        if (p>0) ppg=p.toFixed(3)*1; //Eventueller Rest geht ins Netz
        // Battery
        p=(this.batPower||0)-ppb;
        if (p>0) {pbg=(p*-1).toFixed(3)*1;} // es bleibt nur, dass die Batterie vom Netz geladen wird
        if (p<0) {pbl=Math.min(p*-1,this.loadPower-ppl).toFixed(3)*1; p=p-pbl*-1;} //Power zur Last
        if (p<0) pbg=(p*-1).toFixed(3)*1; //Eventueller Rest geht ins Netz
        // Korrektur, falls PV>>Last und Bat>>Grid. Dann direkt von PV>>Grid
        if (ppl>0 && pbg>0) {
            p=Math.min(ppl, pbg);
            ppg+=p; ppl-=p; pbg-=p; pbl+=p;
        }
        // Grid
        p=this.gridPower-ppg;
        if (p<0) if ((this.batPower||0)>0) {pbg=Math.max(0,this.batPower-ppb)*-1; p=p-pbg;} //Power zur Batterie
        if (p<0) pgl=p*-1; //Eventueller Rest geht zur Last
        // Korrektur, falls PV>>Last und Grid>>Bat. Dann direkt von PV>>Bat
        if (ppl>0 && pbg<0) {
            p=Math.min(ppl, pbg*-1);
            ppb+=p; ppl-=p; pbg+=p; pgl+=p;
        }

        // PV-Load:  Linie: immer  Flow: wenn ppl>0
        this.renderLine_PV_Load(this.ctx,this.flowOffsetX,this.flowWidth,this.flowOffsetY,this.flowHeight,this.ld,ppl);
        // PV-Battery (nur, wenn Batterie vorhanden):  Linie: immer  Flow: wenn ppb>0
        if (this.batPower!=undefined) this.renderLine_PV_Bat(this.ctx,this.flowOffsetX,this.flowWidth,this.flowOffsetY,this.flowHeight,this.ld,ppb);
        // Grid-Load:  Linie: immer  Flow: wenn pgl>0
        this.renderLine_Grid_Load(this.ctx,this.flowOffsetX,this.flowWidth,this.flowOffsetY,this.flowHeight,this.ld,pgl);
        // PV-Grid:  Linie,Flow: wenn ppg>0
        if (ppg>0) this.renderLine_PV_Grid(this.ctx,this.flowOffsetX,this.flowWidth,this.flowOffsetY,this.flowHeight,this.ld,ppg);
        // Bat-Grid:  Linie,Flow: wenn pbg>0
        if (pbg!=0) this.renderLine_Bat_Grid(this.ctx,this.flowOffsetX,this.flowWidth,this.flowOffsetY,this.flowHeight,this.ld,pbg);
        // Bat-Load:  Linie,Flow: wenn pbl>0
        if (pbl>0) this.renderLine_Bat_Load(this.ctx,this.flowOffsetX,this.flowWidth,this.flowOffsetY,this.flowHeight,this.ld,pbl);
    }

    //*** gerade Linien ***
    renderLine_PV_Load(ctx,flowOffsetX,flowWidth,flowOffsetY,flowHeight,ld,power) {
        ctx.beginPath();
        ctx.lineWidth=2;
        var grad=ctx.createLinearGradient(flowOffsetX+flowWidth/2, flowOffsetY, flowOffsetX+flowWidth/2, flowOffsetY+flowHeight);
        grad.addColorStop(0, "orange");
        grad.addColorStop(1, "blue");
        ctx.strokeStyle = grad;
        ctx.moveTo(flowOffsetX+flowWidth/2, flowOffsetY);
        ctx.lineTo(flowOffsetX+flowWidth/2, flowOffsetY+flowHeight);
        ctx.stroke();
        var move=(power>0)?1:0;
        if (move && move!=0) {
            this.pos_PV_Load=Math.min(50,this.pos_PV_Load+0.5+(power/5));
            var x=flowOffsetX+flowWidth/2;
            var y=((move>0)?flowOffsetY:flowOffsetY+flowHeight)+this.pos_PV_Load*2*move;
            if (this.pos_PV_Load>=50) {this.pos_PV_Load=0;}
            this.renderBubble(ctx,x,y);
        }
        else this.pos_PV_Load=0;
    }
    renderLine_Bat_Grid(ctx,flowOffsetX,flowWidth,flowOffsetY,flowHeight,ld,power) {
        ctx.beginPath();
        ctx.lineWidth=2;
        var grad=ctx.createLinearGradient(flowOffsetX, flowOffsetY+flowHeight/2, flowOffsetX+flowWidth, flowOffsetY+flowHeight/2);
        grad.addColorStop(0, "green");
        grad.addColorStop(1, "gray");
        ctx.strokeStyle = grad;
        ctx.moveTo(flowOffsetX, flowOffsetY+flowHeight/2);
        ctx.lineTo(flowOffsetX+flowWidth, flowOffsetY+flowHeight/2);
        ctx.stroke();
        var move=(power<0)?-1:(power>0)?1:0; // kann in beide Richtungen !!
        power=Math.abs(power);
        if (move && move!=0) {
            this.pos_Bat_Grid=Math.min(50,this.pos_Bat_Grid+0.5+(power/5));
            var y=flowOffsetY+flowHeight/2;
            var x=((move>0)?flowOffsetX:flowOffsetX+flowWidth)+this.pos_Bat_Grid*2*move;
            if (this.pos_Bat_Grid>=50) {this.pos_Bat_Grid=0;}
            this.renderBubble(ctx,x,y);
        }
        else this.pos_Bat_Grid=0;
    }
    //***  90-Grad-Linien ***
    renderLine_PV_Bat(ctx,flowOffsetX,flowWidth,flowOffsetY,flowHeight,ld,power) {
        ctx.beginPath();
        ctx.lineWidth=2;
        var grad=ctx.createLinearGradient(flowOffsetX+flowWidth/2-ld, flowOffsetY, flowOffsetX, flowOffsetY+flowHeight/2-ld);
        grad.addColorStop(0, "orange");
        grad.addColorStop(1, "green");
        ctx.strokeStyle = grad;
        ctx.moveTo(flowOffsetX+flowWidth/2-ld, flowOffsetY);
        ctx.lineTo(flowOffsetX+flowWidth/2-ld, flowOffsetY+flowHeight/2-2*ld);
        ctx.arc(flowOffsetX+flowWidth/2-2*ld,flowOffsetY+flowHeight/2-2*ld,ld,0,0.5*Math.PI);
        ctx.lineTo(flowOffsetX, flowOffsetY+flowHeight/2-ld);
        ctx.stroke();
        var move=(power>0)?1:0;
        if (move && move!=0)     {
            this.pos_PV_Bat=Math.min(40,this.pos_PV_Bat+0.5+(power/5));
            var x=this.calcLineX((move>0)?"up":"left",(move>0)?"left":"up",this.pos_PV_Bat,flowOffsetX,flowWidth,ld);
            var y=this.calcLineY((move>0)?"up":"left",(move>0)?"left":"up",this.pos_PV_Bat,flowOffsetY,flowHeight,ld);
            if (this.pos_PV_Bat>=40) {this.pos_PV_Bat=0;}
            this.renderBubble(ctx,x,y);
        }
        else this.pos_PV_Bat=0;
    }
    renderLine_PV_Grid(ctx,flowOffsetX,flowWidth,flowOffsetY,flowHeight,ld,power) {
        ctx.beginPath();
        ctx.lineWidth=2;
        var grad=ctx.createLinearGradient(flowOffsetX+flowWidth/2+ld, flowOffsetY, flowOffsetX+flowWidth, flowOffsetY+flowHeight/2-ld);
        grad.addColorStop(0, "orange");
        grad.addColorStop(1, "gray");
        ctx.strokeStyle = grad;
        ctx.moveTo(flowOffsetX+flowWidth/2+ld, flowOffsetY);
        ctx.lineTo(flowOffsetX+flowWidth/2+ld, flowOffsetY+flowHeight/2-2*ld);
        ctx.arc(flowOffsetX+flowWidth/2+2*ld,flowOffsetY+flowHeight/2-2*ld,ld,Math.PI,0.5*Math.PI,true);
        ctx.lineTo(flowOffsetX+flowWidth, flowOffsetY+flowHeight/2-ld);
        ctx.stroke();
        var move=(power>0)?1:0;
        if (move && move!=0) {
            this.pos_PV_Grid=Math.min(40,this.pos_PV_Grid+0.5+(power/5));
            var x=this.calcLineX((move>0)?"up":"right",(move>0)?"right":"up",this.pos_PV_Grid,flowOffsetX,flowWidth,ld);
            var y=this.calcLineY((move>0)?"up":"right",(move>0)?"right":"up",this.pos_PV_Grid,flowOffsetY,flowHeight,ld);
            if (this.pos_PV_Grid>=40) {this.pos_PV_Grid=0;}
            this.renderBubble(ctx,x,y);
        }
        else this.pos_PV_Grid=0;
    }
    renderLine_Grid_Load(ctx,flowOffsetX,flowWidth,flowOffsetY,flowHeight,ld,power) {
        ctx.beginPath();
        ctx.lineWidth=2;
        var grad=ctx.createLinearGradient(flowOffsetX+flowWidth, flowOffsetY+flowHeight/2+ld, flowOffsetX+flowWidth/2+ld, flowOffsetY+flowHeight);
        grad.addColorStop(0, "gray");
        grad.addColorStop(1, "blue");
        ctx.strokeStyle = grad;
        ctx.moveTo(flowOffsetX+flowWidth, flowOffsetY+flowHeight/2+ld);
        ctx.lineTo(flowOffsetX+flowWidth/2+2*ld, flowOffsetY+flowHeight/2+ld);
        ctx.arc(flowOffsetX+flowWidth/2+2*ld,flowOffsetY+flowHeight/2+2*ld,ld,1.5*Math.PI,Math.PI,true);
        ctx.lineTo(flowOffsetX+flowWidth/2+ld, flowOffsetY+flowHeight);
        ctx.stroke();
        var move=(power>0)?1:0;
        if (move && move!=0) {
            this.pos_Grid_Load=Math.min(40,this.pos_Grid_Load+0.5+(power/5));
            var x=this.calcLineX((move>0)?"right":"down",(move>0)?"down":"right",this.pos_Grid_Load,flowOffsetX,flowWidth,ld);
            var y=this.calcLineY((move>0)?"right":"down",(move>0)?"down":"right",this.pos_Grid_Load,flowOffsetY,flowHeight,ld);
            if (this.pos_Grid_Load>=40) {this.pos_Grid_Load=0;}
            this.renderBubble(ctx,x,y);
            //console.log("renderLine_Grid_Load: ",this.pos_Grid_Load,x,y);
        }
        else this.pos_Grid_Load=0;
    }
    renderLine_Bat_Load(ctx,flowOffsetX,flowWidth,flowOffsetY,flowHeight,ld,power) {
        ctx.beginPath();
        ctx.lineWidth=2;
        var grad=ctx.createLinearGradient(flowOffsetX, flowOffsetY+flowHeight/2+ld, flowOffsetX+flowWidth/2-ld, flowOffsetY+flowHeight);
        grad.addColorStop(0, "green");
        grad.addColorStop(1, "blue");
        ctx.strokeStyle = grad;
        ctx.moveTo(flowOffsetX, flowOffsetY+flowHeight/2+ld);
        ctx.lineTo(flowOffsetX+flowWidth/2-2*ld, flowOffsetY+flowHeight/2+ld);
        ctx.arc(flowOffsetX+flowWidth/2-2*ld,flowOffsetY+flowHeight/2+2*ld,ld,1.5*Math.PI,0);
        ctx.lineTo(flowOffsetX+flowWidth/2-ld, flowOffsetY+flowHeight);
        ctx.stroke();
        var move=(power>0)?1:0;
        if (move && move!=0) {
            this.pos_Bat_Load=Math.min(40,this.pos_Bat_Load+0.5+(power/5));
            var x=this.calcLineX((move>0)?"left":"down",(move>0)?"down":"left",this.pos_Bat_Load,flowOffsetX,flowWidth,ld);
            var y=this.calcLineY((move>0)?"left":"down",(move>0)?"down":"left",this.pos_Bat_Load,flowOffsetY,flowHeight,ld);
            if (this.pos_Bat_Load>=40) {this.pos_Bat_Load=0;}
            this.renderBubble(ctx,x,y);
        }
        else this.pos_Bat_Load=0;
    }

    calcLineX(src,dest,step,flowOffsetX,flowWidth,ld) {
        if (src=="up") {
            if (step<18) return((dest=="right")?flowOffsetX+flowWidth/2+ld:flowOffsetX+flowWidth/2-ld);
            if (step>22) return((dest=="right")?flowOffsetX+flowWidth/2+ld+(step-20)*2:flowOffsetX+flowWidth/2-ld-(step-20)*2);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return((dest=="right")?flowOffsetX+flowWidth/2+ld+ld/2-Math.cos(rad)*ld/2:flowOffsetX+flowWidth/2-ld-ld/2+Math.cos(rad)*ld/2);
        }
        if (src=="left") {
            if (step<18) return(flowOffsetX+step*2);
            if (step>22) return(flowOffsetX+flowWidth/2-ld);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return(flowOffsetX+flowWidth/2-ld-ld/2+Math.sin(rad)*ld/2);
        }
        if (src=="right") {
            if (step<18) return(flowOffsetX+flowWidth-step*2);
            if (step>22) return(flowOffsetX+flowWidth/2+ld);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return(flowOffsetX+flowWidth/2+ld+ld/2-Math.sin(rad)*ld/2);
        }
        if (src=="down") {
            if (step<18) return((dest=="right")?flowOffsetX+flowWidth/2+ld:flowOffsetX+flowWidth/2-ld);
            if (step>22) return((dest=="right")?flowOffsetX+flowWidth/2+ld+(step-20)*2:flowOffsetX+flowWidth/2-ld-(step-20)*2);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return((dest=="right")?flowOffsetX+flowWidth/2+ld+ld/2-Math.cos(rad)*ld/2:flowOffsetX+flowWidth/2-ld-ld/2+Math.cos(rad)*ld/2);
        }
    }
    calcLineY(src,dest,step,flowOffsetY,flowHeight,ld) {
        if (src=="up") {
            if (step<18) return(flowOffsetY+step*2);
            if (step>22) return(flowOffsetY+flowHeight/2-ld);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return(flowOffsetY+flowHeight/2-ld-ld/2+Math.sin(rad)*ld/2);
        }
        if (src=="left") {
            if (step<18) return((dest=="down")?flowOffsetY+flowHeight/2+ld:flowOffsetY+flowHeight/2-ld);
            if (step>22) return((dest=="down")?flowOffsetY+flowHeight/2+ld+(step-20)*2:flowOffsetY+flowHeight/2-ld-(step-20)*2);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return((dest=="down")?flowOffsetY+flowHeight/2+ld+ld/2-Math.cos(rad)*ld/2:flowOffsetY+flowHeight/2-ld-ld/2+Math.cos(rad)*ld/2);
        }
        if (src=="right") {
            if (step<18) return((dest=="down")?flowOffsetY+flowHeight/2+ld:flowOffsetY+flowHeight/2-ld);
            if (step>22) return((dest=="down")?flowOffsetY+flowHeight/2+ld+(step-20)*2:flowOffsetY+flowHeight/2-ld-(step-20)*2);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return((dest=="down")?flowOffsetY+flowHeight/2+ld+ld/2-Math.cos(rad)*ld/2:flowOffsetY+flowHeight/2-ld-ld/2+Math.cos(rad)*ld/2);
        }
        if (src=="down") {
            if (step<18) return(flowOffsetY+flowHeight-step*2);
            if (step>22) return(flowOffsetY+flowHeight/2+ld);
            var rad=90*(step-17)/6 * Math.PI / 180;
            return(flowOffsetY+flowHeight/2+ld+ld/2-Math.sin(rad)*ld/2);
        }
    }

    clearCanvas(canvas,ctx) {
        ctx.fillStyle='white';
        ctx.beginPath();
        ctx.rect(0,0,canvas.width,canvas.height);
 	    ctx.closePath();
 	    ctx.fill();
        ctx.save();
    }
    renderCircle(ctx,x,y,dia,col) {
        col=col || "orange";
        ctx.beginPath();
        ctx.lineWidth=2;
        ctx.strokeStyle=col;
        ctx.arc(x,y,dia/2,0,2*Math.PI);
        ctx.stroke();
    }
    renderCircleName(ctx,text,x,y,col) {
        col=col || "black";
        ctx.beginPath();
        ctx.font = "20px Arial";
        ctx.fillStyle = col;
        ctx.textAlign = "center";
        ctx.fillText(text, x, y); 
    }
    renderCircleValue(ctx,text,x,y,col) {
        col=col || "black";
        ctx.beginPath();
        ctx.font = "18px Arial";
        ctx.fillStyle = col;
        ctx.textAlign = "center";
        ctx.fillText(text, x, y+9); 
        ctx.font = "12px Arial";
        ctx.fillText("kW", x, y+24); 
    }
    renderBubble(ctx,x,y,col) {
        col=col || "violet";
        ctx.beginPath();
        ctx.lineWidth=2;
        ctx.fillStyle=col;
        ctx.arc(x,y,4,0,2*Math.PI);
        ctx.fill();
    }
    renderBatteryImage(ctx,x,y,dia,col) {
        col=col || "black";
        dia/=10;
        x-=2.5*dia; y-=1.5*dia;
        ctx.beginPath();
        ctx.lineWidth=1;
        ctx.strokeStyle=col;
        ctx.rect(x,y,5*dia,-2*dia);
        ctx.fillRect(x+5*dia,y-0.5*dia,3,-1*dia);
        ctx.stroke();
    }
    renderBatteryCapacity(ctx,text,x,y,dia,col) {
        col=col || "black";
        dia/=10;
        y-=2*dia;
        ctx.beginPath();
        ctx.font = "10px Arial";
        ctx.fillStyle = col;
        ctx.textAlign = "center";
        ctx.fillText(text+"%", x, y); 
    }

}

function ToString(v,d,dm,m)
  {
   m=m||100;
   v=v*1; //numerisch erzwingen (sonst gibts bei toFixed nen Fehler)
   var vx=v;
   var vk=1;
   while (vx>=10) {vx/=10; vk++;}
   var s=v.toFixed(d); 
   if (d>0) // nur wenn es Nachkommastellen gibt, ggf anpassen
     {
      while (vk+d>m && dm<d) d--;
      s=v.toFixed(d);
     }
   return(s);
  }    


customElements.define('pv-power-flow-card', PVPowerFlowCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: "pv-power-flow-card",
    name: "PV Power Flow Card",
    description: "A custom card inspired by Huawei" // optional
});
