
//GAME_OVER.js
var GameOver=cc.Layer.extend({

	blockBatchNode:null,

	init:function(){
		var bRet=false;
		if(this._super){

			winSize==cc.director.getWinSize();

			//背景
			var bg=cc.LayerColor.create(cc.color(255,255,255));
			bg.attr({
				anchorX:0,
				anchorY:0,
				x:0,
				y:0
			});
			this.addChild(bg);

			this.blockBatchNode=cc.SpriteBatchNode.create(res.block_png);
			this.addChild(this.blockBatchNode);

			this.initUpAndBottom();

			var scoreLabel=new cc.LabelTTF(""+MW.SCORE,"Arial Black",40);
			this.addChild(scoreLabel);
			scoreLabel.x=winSize.width/2;
			scoreLabel.y=winSize.height/2;

			cc.MenuItemFont.setFontName("Arial Black");
			cc.MenuItemFont.setFontSize(40);

			var shareLabel=cc.LabelTTF.create("分享一下","Arial Black",30);
			shareLabel.color=cc.color(0,0,0);
			var shareBtn=new cc.MenuItemLabel(shareLabel,this.share,this);
			shareBtn.x=winSize.width/4;
			shareBtn.y=winSize.height/4;

			var replayLabel=new cc.LabelTTF("再玩一下","Arial Black",30);
			replayLabel.color=cc.color(0,0,0);
			var replayBtn=new cc.MenuItemLabel(replayLabel,this.replay,this);
			replayBtn.x=winSize.width/5*4;
			replayBtn.y=winSize.height/4;

			var menu=cc.Menu.create(shareBtn,replayBtn);
			this.addChild(menu);
			menu.attr({
				x:0,
				y:0
			});

			bRet=true;
		}
		return bRet;
	},
	share:function(sender){
	},
	replay:function(sender){
		cc.director.runScene(new cc.TransitionFade(1.2,MyChipmunkLayer.scene()));
	},

	initUpAndBottom:function(){
		var beginX=10;
		var bWidth;
		for(var i=0;i<MW.TOP_BLOCK_CNT;i++){
			var blockSpUp=cc.Sprite.create("#block_1.png");
			this.blockBatchNode.addChild(blockSpUp,1);
			bWidth=blockSpUp.getContentSize().width;

			blockSpUp.attr({
				anchorX:0,
				anchorY:1,
				x:beginX+i*(bWidth/2+MW.BLOCK_SPACES),
				y:winSize.height
			});

			blockSpUp.setTag(MW.BLOCK_UP_TAG+i);
			var blockSpDown=cc.Sprite.create("#block_2.png");
			this.blockBatchNode.addChild(blockSpDown,1);
			//blockSpDown.setFlippedY(true);
			blockSpDown.attr({
				anchorX:0,
				anchorY:0,
				x:beginX+i*(bWidth/2+MW.BLOCK_SPACES),
				y:0
			});
			blockSpDown.setTag(MW.BLOCK_DOWN_TAG+i);
		}
	}
});
GameOver.create=function(){
	var sg=new GameOver();
	if(sg&&sg.init()){
		return sg;
	}
	return null;
};

GameOver.scene=function(){
	var scene=cc.Scene.create();
	var layer=GameOver.create();
	scene.addChild(layer);
	return scene;
};