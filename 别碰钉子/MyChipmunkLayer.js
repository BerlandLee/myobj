
var MyChipmunkLayer = cc.Layer.extend({

    _debugNode: null,           //测试NODE

    space: null,                //物理世界

    blockBatchNode: null,

    box: null,                 //
    downUpAction: null,     //开场时，上下移动的动画
    boxDirectionX: 1,          //飞的方向 -1为向左飞 1为向右飞

    titleLabel: null,           //标题
    scoreLabel: null,           //分数

    leftBlockArray: null,       //左侧出来的BLOCK
    rightBlockArray: null,      //右侧出来的BLOCK
    leftBodyArray: null,        //左侧出来的BLOCK物体
    rightBodyArray: null,       //右侧出来的BLOCK物体

    ctor: function () {
        this._super();
        //初始化物理世界
        this.space = new cp.Space();
    },

    init: function () {
        var bRet = false;

        if(this._super()){

            winSize = cc.director.getWinSize();

            //背景
            var bg = cc.LayerColor.create(cc.color(255,255,255));
            bg.attr({
                anchorX : 0,
                anchorY : 0,
                x : 0,
                y : 0
            });
            this.addChild(bg);

            cc.spriteFrameCache.addSpriteFrames(res.block_plist);
            var b_texture = cc.textureCache.addImage(res.block_png);

            this.blockBatchNode = cc.SpriteBatchNode.create(res.block_png);
            this.addChild(this.blockBatchNode);

            this.titleLabel = cc.LabelTTF.create("别碰钉子","Arial Black", 48);
            this.titleLabel.x = winSize.width/2;
            this.titleLabel.y = winSize.height/4*3;
            this.titleLabel.color = cc.color(255,0,0);
            this.addChild(this.titleLabel);

            //分数
            this.scoreLabel = cc.LabelTTF.create("0", "Arial Black", 80);
            this.scoreLabel.x = winSize.width / 2;
            this.scoreLabel.y = winSize.height / 2;
            this.scoreLabel.color = cc.color(200,200,200);
            this.addChild(this.scoreLabel);
            this.scoreLabel.setVisible(false);

            //初始化物理世界
            this.initPhysics();
            //初始化正方形
            this.initBoxWithBody();
            //初始化上下方的可碰撞物并添加到物理世界中
            this.initUpAndBottom();

            bRet = true;
        }

        return bRet;
    },

    onEnter: function () {
        this._super();

        cc.sys.dumpRoot();
        cc.sys.garbageCollect();

        //事件处理
        if( 'touches' in cc.sys.capabilities ){
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ALL_AT_ONCE,
                onTouchesEnded: function(touches, event){
                    event.getCurrentTarget().processEvent( touches[0] );
                }
            }, this);
        } else if( 'mouse' in cc.sys.capabilities ){
            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseDown: function(event){
                    event.getCurrentTarget().processEvent( event );
                }
            }, this);
        }

        //重置数据
        this.resetDatas();
        //
        this.scheduleUpdate();

        //添加碰撞监听事件
        // 1 & 2 检测box和上下BLOCK碰撞
        this.space.addCollisionHandler( 1, 2,
            this.collisionBegin.bind(this),
            this.collisionPre.bind(this),
            this.collisionPost.bind(this),
            this.collisionSeparate.bind(this)
        );
        // 1 & 3 检测box和左右边界碰撞
        this.space.addCollisionHandler( 1, 3,
            this.collisionBegin.bind(this),
            this.collisionPre.bind(this),
            this.collisionPost.bind(this),
            this.collisionSeparate.bind(this)
        );
        // 1 & 4 检测box和左右BLOCK碰撞
        this.space.addCollisionHandler( 1, 4,
            this.collisionBegin.bind(this),
            this.collisionPre.bind(this),
            this.collisionPost.bind(this),
            this.collisionSeparate.bind(this)
        );
    },

    onExit : function() {
        //移除物理碰撞检测
        this.space.removeCollisionHandler( 1, 2 );
        this.space.removeCollisionHandler( 1, 3 );
        this.space.removeCollisionHandler( 1, 4 );

        this._super();
    },

    //事件处理
    processEvent: function (event) {

        var location = event.getLocation();

        if(MW.CUR_GAME_STATUS == MW.GAME_STATUS.GAME_START){
            //开始游戏
            this.startGame();
        }else if(MW.CUR_GAME_STATUS == MW.GAME_STATUS.GAME_IN){

            if(!MW.TOUCH_FLAG)
                return;

            //每次点击，给(body)施加一次力
            this.doForceBox();

        }
    },

    doForceBox: function () {

        var speed = 450;
        var x = this.boxDirectionX * speed * Math.cos(45*Math.PI/180);
        var y = speed * Math.sin(60*Math.PI/180);
        this.box.getBody().setVel(cp.v(0,0));
        this.box.getBody().applyImpulse(cp.v(x,y), cp.v(0, 0));

    },

    initDebugMode: function () {
        this._debugNode = cc.PhysicsDebugNode.create(this.space);
        this.addChild(this._debugNode);
    },

    initPhysics: function () {
        var space = this.space ;
        var staticBody = space.staticBody;

        //开启物体形状测试
        //this.initDebugMode();

        // Gravity
        space.gravity = cp.v(0, -980);      //重力
        space.sleepTimeThreshold = 0.5;     //休眠临界时间
        space.collisionSlop = 0.5;          //

        // Walls--四个边界
        var walls = [ new cp.SegmentShape( staticBody, cp.v(0,0-1), cp.v(winSize.width,0), 0-1 ),				// bottom
            new cp.SegmentShape( staticBody, cp.v(0,winSize.height), cp.v(winSize.width,winSize.height), 0),	// top
            new cp.SegmentShape( staticBody, cp.v(0,0), cp.v(0,winSize.height), 0),				// left
            new cp.SegmentShape( staticBody, cp.v(winSize.width,0), cp.v(winSize.width,winSize.height), 0)	// right
        ];
        for( var i=0; i < walls.length; i++ ) {
            var shape = walls[i];
            shape.setElasticity(1);         //弹性
            shape.setFriction(0);           //摩擦
            //space.addStaticShape( shape );
            space.addShape( shape );
            if(i >= 2){
                shape.setCollisionType(3);
            }
            shape.setLayers(1);
        }
    },

    initBoxWithBody: function () {
        //物体的定义
        var mass = 1;
        var boxWidth = 32;

        var body = new cp.Body(mass, cp.momentForBox(mass, boxWidth, boxWidth) );
        body.setPos( cc.p(winSize.width/2, winSize.height/2) );
        this.space.addBody( body );
        var shape = new cp.BoxShape( body, boxWidth, boxWidth);
        shape.setElasticity( 0.5 );
        shape.setFriction( 0.3 );
        shape.setCollisionType(1);
        shape.setLayers(3);
        this.space.addShape( shape );

        //创建一个箱子
        var v_texture = cc.textureCache.addImage(res.box_png);
        this.box = new cc.PhysicsSprite(v_texture,cc.rect(0,0,boxWidth,boxWidth));
        this.box.setBody(body);
        this.addChild(this.box,1);
        this.box.setTag(101);

        //上下移动
        var moveTo1 = cc.MoveTo.create(0.5, winSize.width / 2, this.box.y + 40);
        var moveTo2 = cc.MoveTo.create(0.5, winSize.width / 2, this.box.y - 40);
        this.downUpAction = cc.RepeatForever.create(cc.Sequence.create(moveTo1,moveTo2));
        this.box.runAction(this.downUpAction);
    },

    initUpAndBottom: function () {
        //创建上下方的BLOCKS
        var beginX = 10;
        for(var i=0; i<MW.TOP_BLOCK_CNT; i++){
            var upX = beginX + (i+1)*MW.BLOCK_HEIGHT/2 + i*MW.BLOCK_SPACES;
            var upY = winSize.height - MW.BLOCK_WIDTH/2;
            var upPos = cc.p(upX, upY);
            var upTag = MW.BLOCK_UP_TAG + i;
            this.createBlockWithBody(1,upPos,upTag);

            var downX = upX;
            var downY = MW.BLOCK_WIDTH/2;
            var downPos = cc.p(downX, downY);
            var downTag = MW.BLOCK_DOWN_TAG + i;
            this.createBlockWithBody(2,downPos,downTag);
        }
    },

    updateBoxAndBlocks: function () {
        MW.SCORE += MW.LEVEL_UP_EVERY;          //分数增加
        this.scoreLabel.setString("" + MW.SCORE);
        this.updateBlocks();                            //刷新碰撞物
    },

    updateBlocks: function () {
        this.removeBlocks();
        this.addBlocks();
        //this.scheduleOnce(this.addBlocks,0.04);
    },

    removeBlocks: function () {

        //删除操作
        if(this.boxDirectionX == 1){

            //移除左边的BLOCK对应的shape
            if(this.leftBodyArray.length > 0)
            {
                var len = this.leftBodyArray.length;
                for(var i=0; i<len; i++){
                    var shape = this.leftBodyArray[i];
                    this.space.removeShape(shape);
                }
                this.leftBodyArray = [];
            }
            //移除左边的BLOCK
            if(this.leftBlockArray.length > 0){
                var len = this.leftBlockArray.length;
                for(var i=0; i< len; i++){
                    var tmpNode = this.leftBlockArray[i];
                    tmpNode.removeFromParent();
//                    var delayAction = cc.DelayTime.create(0.01 * (len - i));
//                    var moveToAction = cc.MoveTo.create(0.02,cc.p(tmpNode.x - MW.BLOCK_HEIGHT*2, tmpNode.y));
//                    var actionFinish = cc.CallFunc.create(function () {
//                        tmpNode.removeFromParent();
//                    },this);
//                    tmpNode.runAction(cc.Sequence.create(delayAction,moveToAction,actionFinish));
                }
                this.leftBlockArray = [];
            }

        }else{

            //移除右边的BLOCK对应的SHAPE
            if(this.rightBodyArray.length > 0)
            {
                var len = this.rightBodyArray.length;
                for(var i=0; i<len; i++){
                    var shape = this.rightBodyArray[i];
                    this.space.removeShape(shape);
                }
                this.rightBodyArray = [];
            }
            //移除右边的BLOCK
            if(this.rightBlockArray.length > 0){
                var len = this.rightBlockArray.length;
                for(var i=0; i< len; i++){
                    var tmpNode = this.rightBlockArray[i];
                    tmpNode.removeFromParent();
//                    var delayAction = cc.DelayTime.create(0.01 * (len - i));
//                    var moveToAction = cc.MoveTo.create(0.02,cc.p(tmpNode.x + MW.BLOCK_HEIGHT*2, tmpNode.y));
//                    var actionFinish = cc.CallFunc.create(function () {
//                        tmpNode.removeFromParent();
//                    },this);
//                    tmpNode.runAction(cc.Sequence.create(delayAction,moveToAction,actionFinish));
                }
                this.rightBlockArray = [];
            }
        }
    },

    addBlocks: function () {

        var beginX,         //BLOCK开始位置X
            endX,           //BLOCK结束位置X
            _tag,           //BLOCK的tag
            _direction;     //方向

        //删除操作
        if(this.boxDirectionX == 1) {

            beginX = winSize.width + MW.BLOCK_HEIGHT;
            endX = winSize.width - MW.BLOCK_HEIGHT / 2;
            _tag = MW.BLOCK_RIGHT_TAG;
            _direction = 4;
        }else {

            beginX = -MW.BLOCK_HEIGHT;
            endX = MW.BLOCK_HEIGHT / 2;
            _tag = MW.BLOCK_LEFT_TAG;
            _direction = 3;
        }

        var curViewNum = getBlockCount(this.boxDirectionX);

        if(curViewNum < 1)
            curViewNum = 1;

        var beginHeight = 200;
        var endHeight = winSize.height - 200;
        var tmpHeight = beginHeight;
        var tmpH = Math.floor(cc.random0To1() * 7) + 1;

        //左或者右--新增BLOCK
        for(var i=0; i<curViewNum; i++){

            tmpHeight += tmpH * MW.BLOCK_HEIGHT + cc.random0To1()*20;
            if((tmpHeight + 60) >= endHeight){
                tmpHeight = (8 - tmpH + curViewNum - i) * MW.BLOCK_HEIGHT * cc.random0To1()*20;
            }

            var posX = endX;
            var posY = tmpHeight;
            var blockSp = this.createBlockWithBody(_direction, cc.p(posX, posY), _tag + i);
//            blockSp.x = beginX;
//            blockSp.y = posY;

            if(this.boxDirectionX == 1)
            {
                this.rightBlockArray[i] = blockSp;
            }else{
                this.leftBlockArray[i] = blockSp;
            }
//            var delayAction = cc.DelayTime.create(0.01*(curViewNum - i));
//            var moveToAction = cc.MoveTo.create(0.02, cc.p(endX, posY));
//            blockSp.runAction(cc.Sequence.create(delayAction,moveToAction));
        }
    },

    update: function (dt) {
        //在游戏中的处理
        if(MW.CUR_GAME_STATUS == MW.GAME_STATUS.GAME_IN){
            //这个必须有，物理世界对刚体的处理
            this.space.step(1/60.0);
        }
    },

    collisionBegin : function ( arbiter, space ) {

        var shapes = arbiter.getShapes();

        var shapeA = shapes[0];
        var shapeB = shapes[1];

        var collTypeA = shapeA.collision_type;
        var collTypeB = shapeB.collision_type;

        if(collTypeB == 3){
            console.log( 'Collision Type A:' + collTypeA );
            console.log( 'end Collision Type B:' + collTypeB );

            this.boxDirectionX = -this.boxDirectionX;

            this.space.addPostStepCallback(function () {
                this.updateBoxAndBlocks();
            }.bind(this));
        }else if(collTypeB == 2 || collTypeB == 4)
        {//碰到上下墙壁 或者 左右出来的BLOCKS 就Gameover
            this.gameOver();
        }

        return true;
    },

    collisionPre : function ( arbiter, space ) {
        //console.log('collision pre');
        return true;
    },

    collisionPost : function ( arbiter, space ) {
        //console.log('collision post');
    },

    collisionSeparate : function ( arbiter, space ) {
        //console.log('collision separate');
    }

});

MyChipmunkLayer.prototype.resetDatas = function () {
    //初始化box的运动方向
    this.boxDirectionX = 1;
    //可点击
    MW.TOUCH_FLAG = true;
    //重置游戏状态
    MW.CUR_GAME_STATUS = MW.GAME_STATUS.GAME_START;
    //重置分数
    MW.SCORE = 0;

    this.leftBlockArray = [];
    this.rightBlockArray = [];
    this.leftBodyArray = [];
    this.rightBodyArray = [];
};

MyChipmunkLayer.prototype.hideBeginUI = function () {
    var fadeOut1 = cc.FadeOut.create(0.4);

    var actionFinish = cc.CallFunc.create(function () {
        this.scoreLabel.setVisible(true);
    },this);

    this.titleLabel.runAction(cc.Sequence.create(fadeOut1, actionFinish));
};

MyChipmunkLayer.prototype.createBlockWithBody = function (direction, pos, tag) {

    if(direction < 1 || direction > 4)
        return;

    var boxX = direction < 3 ? MW.BLOCK_HEIGHT : MW.BLOCK_WIDTH;
    var boxY = direction < 3 ? MW.BLOCK_WIDTH : MW.BLOCK_HEIGHT;

    var spName = "#block_" + direction + ".png";

    var body = new cp.Body(Infinity, Infinity);
    body.nodeIdleTime = Infinity;
    body.setPos( pos );

    var verts;

    if(direction == 1){//上
        verts = [
                -boxX/2,boxY/2,
                boxX/2,boxY/2,
                boxX/2,16,
            0,-boxY/2,
                -boxX/2,16
        ];
    }else if(direction == 2){//下
        verts = [
                -boxX/2,-boxY/2,
                -boxX/2,-16,
            0,boxY/2,
                boxX/2,-16,
                boxX/2,-boxY/2
        ];
    }else if(direction == 3){//左
        verts = [
                -boxX/2,-boxY/2,
                -boxX/2,boxY/2,
            -16,boxY/2,
                boxX/2,0,
            -16,-boxY/2
        ];
    }else{//右
        verts = [
                -boxX/2,0,
            16,boxY/2,
                boxX/2,boxY/2,
                boxX/2,-boxY/2,
            16,-boxY/2
        ];
    }

    //创建一个多边形
    var shape = new cp.PolyShape(body,verts,cp.vzero);
    shape.setElasticity( 1 );
    shape.setFriction( 0.5 );
    shape.setCollisionType(2);
    shape.setLayers(2);
    //把创建的多边形加到物理世界中
    this.space.addShape( shape );

    //存储即将删除的多边形
    if(direction == 3)
    {
        this.leftBodyArray[tag - MW.BLOCK_LEFT_TAG] = shape;

    }else if(direction == 4){
        this.rightBodyArray[tag - MW.BLOCK_RIGHT_TAG] = shape;
    }

    //生成BLOCK
    var blockSp = cc.PhysicsSprite.create(spName);
    blockSp.setBody( body );
    this.blockBatchNode.addChild(blockSp);
    blockSp.setTag( tag );

    return blockSp;
};

MyChipmunkLayer.prototype.startGame = function () {
    //隐藏开始界面的UI
    this.hideBeginUI();
    this.box.stopAllActions();

    //改变游戏状态
    MW.CUR_GAME_STATUS = MW.GAME_STATUS.GAME_IN;

    //给个初始力
    this.doForceBox();
};

MyChipmunkLayer.prototype.gameOver = function () {
    //游戏结束
    MW.TOUCH_FLAG = false;

    this.box.getBody().applyImpulse(cp.v(this.boxDirectionX * 20,600), cp.v(10, 0));

    this.scheduleOnce(function () {
        MW.CUR_GAME_STATUS = MW.GAME_STATUS.GAME_OVER;
        cc.director.runScene(cc.TransitionFade.create(1.2,GameOver.scene()));
    }, 1);

};

MyChipmunkLayer.create = function () {
    var sg = new MyChipmunkLayer();
    if(sg && sg.init()){
        return sg;
    }
    return null;
};

MyChipmunkLayer.scene = function () {
    var scene = cc.Scene.create();
    var layer = MyChipmunkLayer.create();
    scene.addChild(layer);
    return scene;
};