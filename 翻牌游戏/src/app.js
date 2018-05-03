//app.js
var gameLayer;
var gameArray=[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7];
var pickedTiles=[];
var scoreText;
var moves=0;

var gameScene=cc.Scene.extend({
	onEnter:function(){
		this._super();
		gameArray=shuffle(gameArray);//打乱数组顺序
		gameLayer=new game();
		gameLayer.init();
		this.addChild(gameLayer);
	}
});

var game=cc.Layer.extend({
	init:function(){
		this._super();
		var backgroundLayer=new cc.LayerColor(new cc.Color(40,40,40,255),640,960);
		this.addChild(backgroundLayer);

		var gradient=new cc.LayerGradient(cc.color(0,0,0,255),cc.color(0x46,0x82,0xB4,255));
		this.addChild(gradient);

		scoreText=new cc.LabelTTF("Moves:0","Arial","48");
		this.addChild(scoreText);
		scoreText.setPosition(100,70);


		for(i=0;i<16;i++){
			var tile=new MemoryTile();
			tile.pictureValue=gameArray[i];
			this.addChild(tile,0);
			tile.setPosition(70+i%4*154,572-Math.floor(i/4)*164);
		}
	}
});

var MemoryTile=cc.Sprite.extend({
	ctor:function(){
		this._super();
		this.initWithFile("assets/cover.png");

		var listener=cc.EventListener.create({
			event:cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches:true,
			onTouchBegan:function(touch,event){
				if(pickedTiles.length<2){
					var target=event.getCurrentTarget();
					var location=target.convertToNodeSpace(touch.getLocation());
					var targetSize=target.getContentSize();
					var targetRectangle=cc.rect(0,0,targetSize.width,targetSize.height);
					if(cc.rectContainsPoint(targetRectangle,location)){
						if(pickedTiles.indexOf(target)==-1){
							target.initWithFile("assets/title_"+target.pictureValue+".png");
							pickedTiles.push(target);
							if(pickedTiles.length==2){
								checkTiles();
							}
						}
					}
				}
			}
		});
		cc.eventManager.addListener(listener.clone(),this);
	}
});

function checkTiles(){
	moves++;
	scoreText.setString("Move:"+moves);
	var pause=setTimeout(function(){
		if(pickedTiles[0].pictureValue!=pickedTiles[1].pictureValue){
			pickedTiles[0].initWithFile("assets/cover.png");
			pickedTiles[1].initWithFile("assets/cover.png");
		}
		else{
			gameLayer.removeChild(pickedTiles[0]);
			gameLayer.removeChild(pickedTiles[1]);
		}
		pickedTiles=[];
	},500);
}
//js打乱数组？？？
shuffle=function(v){
	for(var j,x,i=v.length;i;j=parseInt(Math.random()*i),x=v[--i],v[i]=v[j],v[j],v[j]=x);
	return v;
};

/*
var HelloWorldLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        //////////////////////////////
        // 1. super init first
        this._super();

        /////////////////////////////
        // 2. add a menu item with "X" image, which is clicked to quit the program
        //    you may modify it.
        // ask the window size
        var size = cc.winSize;

        var mainscene = ccs.load(res.MainScene_json);
        this.addChild(mainscene.node);

        return true;
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});
*/
