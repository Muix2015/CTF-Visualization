var XCTF = function () {

	var ready = false;

	var container;
	var camera, scene, renderer;
	var RAD_90  = 90/180*Math.PI;            					//90度的弧度值，后面会多次用到 定义为变量减少运算

	var teamMesh, teamMaterial;

	var missileDae;

	var missileLauncher = new THREE.Group();					//发射架组，发射架的模型有两个部分，会先添加进Group中再进行操作
	var teamFlag        = new THREE.Group();                    //旗帜组  暂时没用到
	var baseMesh;                 								//发射架底部棱台
	var serviceMesh;                                            //周围的服务

	//初始方向向量   用于计算角度
	var missileVec 	= new THREE.Vector3(1,0,0);
	var launcherVec = new THREE.Vector3(0,-1,0);

	//偏移量   模型加载进来时的位置可能并不是在坐标原点，需要通过偏移量调整
	var baseOffset    = new THREE.Vector3(0,0,-60);
	var serviceOffset = new THREE.Vector3(0,0,0);
	var logoOffset    = new THREE.Vector3(0,0,330);
	var cameraOffset  = new THREE.Vector3(100,100,100);

	//队伍数据数组,会保存每个队伍的模型和信息(如血量)
	var teamsData = [];

	var particleSystems = [];



	function attackCallback(defenderNumber,status) {
		var defender = teamsData[defenderNumber-1];
		if(status == 0){

		}else{
			defender.currentHP -= 1;
			defender.logo.position.z -= 100;
		}
	}


	/*
	 * 攻击函数
	 * @param timestamp     时间戳
	 * @param attackerNumber 	攻击方编号(1-N)
	 * @param defenderNumber 	防守方编号(1-N)
	 * @param serviceNum    被攻击的服务编号(1-4)
	 * @param status        攻击结果
	 */
	function attack( timestamp, attackerNumber, defenderNumber, serviceNum, status ){

		var attacker = teamsData[attackerNumber-1];
		var defender = teamsData[defenderNumber-1];

		var time = 1800;

		var missile = missileDae.clone();
		var quaternion = new THREE.Quaternion();
		var rotation = new THREE.Euler();

		var startPos 	= 	attacker.launcher.position;
		var endPos 		= 	defender.services[serviceNum].position;
		var dx = endPos.x - startPos.x;
		var dy = endPos.y - startPos.y;
		var d = Math.sqrt(dx*dx+dy*dy);

		var targetVec = new THREE.Vector3(dx,dy,0);							//指向目标的方向向量

		//轨迹  curve是轨迹的曲线   pos会用于后面tween中的计算
		var trajectory = {
			curve :	 new THREE.SplineCurve3([
							    new THREE.Vector3(startPos.x, startPos.y, 150),
							    new THREE.Vector3(startPos.x + dx/3, startPos.y + dy/3, d/4), 
							    new THREE.Vector3(endPos.x - dx/3, endPos.y - dy/3, d/4),
							    new THREE.Vector3(endPos.x, endPos.y, 50)
							]),
			pos : 0
		}

		// var geometry = new THREE.Geometry();
		// geometry.vertices = trajectory.curve.getPoints(50);
		// var material = new THREE.LineBasicMaterial({color : 0xee00ee});
		// var line = new THREE.Line(geometry, material);

		// // scene.add( line );


		// var tangent; 

		// //发射导弹
		// var launch = new TWEEN.Tween( trajectory )
		// 					.to({pos:1},time)
		// 					.onStart(function(){
		// 						scene.add(missile);
		// 						attacker.launcher.children[1].visible = false;         
		// 					})
		// 					.onUpdate(function(){
						
		// 						missile.position.copy(trajectory.curve.getPointAt(trajectory.pos));  	//获取位置
		// 						tangent = trajectory.curve.getTangentAt(trajectory.pos).normalize();    //获取导弹轨迹曲线的切向方向向量
		// 						quaternion.setFromUnitVectors(missileVec , tangent);                    //根据切向向量和导弹初始方向向量计算四元数
		// 						rotation.setFromQuaternion(quaternion,'XYZ');							//将四元数转换成欧拉角
		// 						missile.rotation.set(rotation.x,rotation.y,rotation.z);
								
		// 						camera.position.copy(trajectory.curve.getPointAt(trajectory.pos)).add(cameraOffset);
		// 						camera.lookAt(missile.position);
		// 						// particle(trajectory.pos*10);

		// 					})
		// 					.onComplete(function(){
		// 						scene.remove(missile);
		// 						missile = null;
		// 						scene.remove(line);
		// 						line = null;
		// 						attacker.launcher.children[1].visible = true;
		// 					});

		var rot = launcherVec.angleTo(targetVec);

		// rot = dy > 0 ? -rot : dy==0 ? dx<0 ? -rot : rot : rot;	
		rot = dx > 0 ?rot :-rot;	//修正旋转角度


		//旋转发射架 对准目标
		var aim = new TWEEN.Tween( attacker.launcher.rotation )
						.to({z:rot},500)
						.onComplete(function(){
							// launch.start();				//旋转完成后发射
							startParticles(defenderNumber,status,trajectory.curve , time );
						})
						.start();

	}

	/*
	 * 生成天空盒
	 * @param urls 	   数组,天空盒六个方向的图片路径
	 * @param size 	   天空盒大小
	 * @return  	   天空盒
	 */
	function makeSkybox( urls, size ) {

		var skyboxCubemap = new THREE.CubeTextureLoader().load( urls );
		skyboxCubemap.format = THREE.RGBFormat;
		var skyboxShader = THREE.ShaderLib['cube'];
		skyboxShader.uniforms['tCube'].value = skyboxCubemap;
		return new THREE.Mesh(
			new THREE.BoxGeometry( size, size, size ),
			new THREE.ShaderMaterial({
				fragmentShader : skyboxShader.fragmentShader, vertexShader : skyboxShader.vertexShader,
				uniforms : skyboxShader.uniforms, depthWrite : false, side : THREE.BackSide
			})
		);

	}




	function initparticleSystems(){

		var canvas1 = document.createElement( 'canvas' );
		canvas1.width = 16;
		canvas1.height = 16;

		var materials = [];

		var context1 = canvas1.getContext( '2d' );
		var gradient1 = context1.createRadialGradient( canvas1.width / 2, canvas1.height / 2, 0, canvas1.width / 2, canvas1.height / 2, canvas1.width / 2 );
		gradient1.addColorStop( 0, 'rgba(255,0,0,1)' );
		gradient1.addColorStop( 0.2, 'rgba(255,10,10,1)' );
		gradient1.addColorStop( 0.4, 'rgba(64,0,0,1)' );
		gradient1.addColorStop( 1, 'rgba(0,0,0,1)' );

		context1.fillStyle = gradient1;
		context1.fillRect( 0, 0, canvas1.width, canvas1.height );

		var material = new THREE.SpriteMaterial( {
				map: new THREE.CanvasTexture( canvas1 ),
				blending: THREE.AdditiveBlending
			});
		materials.push(material);

		var canvas2 = document.createElement( 'canvas' );
		canvas2.width = 16;
		canvas2.height = 16;
		var context2 = canvas2.getContext( '2d' );
		var gradient2 = context2.createRadialGradient( canvas2.width / 2, canvas2.height / 2, 0, canvas2.width / 2, canvas2.height / 2, canvas2.width / 2 );
		
		
		gradient2.addColorStop( 0, 'rgba(0,0,210,1)' );
		gradient2.addColorStop( 0.2, 'rgba(10,10,210,1)' );
		gradient2.addColorStop( 0.4, 'rgba(0,0,64,1)' );
		gradient2.addColorStop( 1, 'rgba(0,0,0,1)' );


		context2.fillStyle = gradient2;
		context2.fillRect( 0, 0, canvas2.width, canvas2.height );

		var material = new THREE.SpriteMaterial( {
				map: new THREE.CanvasTexture( canvas2 ),
				blending: THREE.AdditiveBlending
			});
		materials.push(material);

		console.log(materials);

		for(var i=0;i<20;i++){
			var particleArr = {
				available : true,
				particles : []
			};
			for(var j=0;j<60;j++){
				var particle = new THREE.Sprite( materials[i%2] );
				particle.pos = 0;
				particle.visible = false;
				particleArr.particles.push(particle);
				scene.add(particle);
			}
			particleSystems.push(particleArr);
		}
	}



	function startParticles(defenderNumber,status,curve ,time) {
		for(var i=0;i<particleSystems.length;i++){
			if(particleSystems[i].available){

				var particleSystem = particleSystems[i];
				particleSystem.available = false;

				var firstParticle = particleSystem.particles[0];
				var lastParticle  = particleSystem.particles[particleSystem.particles.length-1];

				for(var i=0;i<particleSystem.particles.length;i++){

					var particle = particleSystem.particles[i];
					particle.visible = true;
					particle.scale.set(60-i,60-i,0);
					new TWEEN.Tween( particle )
						.delay( i*10 )
						.to( {pos:1}, 1800 )
						.onUpdate(function(){
							this.position.copy(curve.getPointAt(this.pos));
						})
						.onComplete(function(){
							this.pos = 0;
							this.visible = false;
							if(this === firstParticle){
								attackCallback(defenderNumber,status);
							}else if(this === lastParticle){
								particleSystem.available = true;
							}			
						})
						.start();
				}
				break;
			}
		}

	}



	function init() {

		container = document.createElement( 'div' );
		document.body.appendChild( container );

		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100000 );
		camera.position.set( 0, -5000, 2900 );
		// camera.rotation.x = RAD_90;
		camera.lookAt( new THREE.Vector3() );

		scene = new THREE.Scene();

		controls = new THREE.TrackballControls( camera , container );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

		initparticleSystems();

		stats = new Stats();
		stats.domElement.id = 'fps';
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild( stats.domElement );

		var loader = new THREE.ColladaLoader();

		var onProgress = function ( xhr ) {
			if ( xhr.lengthComputable ) {
					var percentComplete = xhr.loaded / xhr.total * 100;
					console.log( Math.round(percentComplete, 2) + '% downloaded' );
			}
		};

		var onError = function ( xhr ) {
		};

		// 

		var baseGeo = new THREE.CylinderGeometry(60, 80, 80, 5, 3);
		var baseMaterial = new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } );
		var baseMesh = new THREE.Mesh( baseGeo, baseMaterial );
		baseMesh.rotation.x = -RAD_90;
		baseMesh.position.z = -60;



		//宇宙天空盒

		var r = "img/skybox1/";
		var urls = [ r + "px.jpg", r + "nx.jpg",
					 r + "py.jpg", r + "ny.jpg",
					 r + "pz.jpg", r + "nz.jpg" ];

		scene.add( makeSkybox( urls, 50000 ) );

		function initTeams (num) {
			var sphereGeo =new THREE.SphereGeometry(80,30);
			var sphereMat = new THREE.MeshBasicMaterial( { color : 0xff0000 } );
			// sphereMat.transparent=true;
			// sphereMat.opacity=0.6;
			var sphere = new THREE.Mesh( sphereGeo, sphereMat );

			// new TWEEN.Tween(sphere.material).to({opacity: 0.3},300).repeat( 10 ).yoyo(true).onComplete(function(){scene.remove(sphere);}).start();

			console.log(sphere);
			// scene.add(sphere);

			var positionData = AllTeamsPositionData[num-12];

			for(var i=0;i<num;i++){
				teamsData[i] = constructTeamObject( i, positionData[i] );
			}

			ready = true;

		}



		/*
		 * 构造队伍的模型，包括导弹发射架及五个服务的模型
		 * @param  num         编号
		 * @param  position    位置
		 * @return obj 	       包含队伍所有模型及信息的对象
		 */
		function constructTeamObject ( num , position ){

			var obj;

			var teamLauncherMesh 	= 	missileLauncher.clone();
			var teamBaseMesh 		= 	baseMesh.clone();
			var flag 				= 	teamFlag.clone();

			teamLauncherMesh.position.copy(position);
			teamBaseMesh.position.copy(position).add(baseOffset);

			var orbit = new THREE.EllipseCurve(
				position.x,  position.y,            
				200, 200,          
				0,  2*Math.PI,  
				false,            
				0                
			);

			teamLauncherMesh.rotation.z = Math.random()*RAD_90*4;
			scene.add(teamLauncherMesh);
			scene.add(teamBaseMesh);
			scene.add(flag);
			var pos=0;
			var servicesArr = [];
			for(var i=0;i<5;i++){
				var service = serviceMesh.clone();
				service.position.x = orbit.getPointAt(pos).x;
				service.position.y = orbit.getPointAt(pos).y;
				service.position.add(serviceOffset);
				service.rotation.y = -i*2*Math.PI/5+RAD_90;
				new TWEEN.Tween(service.position).to({z: 10},1000).delay(Math.random()*500).repeat( Infinity ).yoyo(true).start();
				servicesArr.push(service);
				scene.add(service);
				pos+=0.2;
			}


			var logoTexture =	THREE.ImageUtils.loadTexture('img/logo/'+teamsOption.data[num].logo);			
			var logoGeo =new THREE.BoxGeometry(300,0.1,200);
			var logoMat = new THREE.MeshBasicMaterial( {map : logoTexture} );
			logoMat.transparent=true;
			logoMat.opacity= 0.4;
			var logo = new THREE.Mesh( logoGeo, logoMat );
			logo.position.copy(position).add(logoOffset);
			scene.add(logo);

			return obj = {
				number : teamsOption.data[num].num,                   //队伍编号
				name : teamsOption.data[num].name,                    //队伍名称
				launcher : teamLauncherMesh,                          //导弹发射架
				services : servicesArr,                               //服务
				base : teamBaseMesh,                                  //发射架下方的棱台
				logo : logo,                                          //队伍LOGO 将来用于保存图片文件路径或名字
				HP : 100,                                             //总血量
				currentHP : 100,                                      //当前血量
				position : teamLauncherMesh.position                  //位置
			}

		}


		//加载导弹发射架的第一个部分
		loader.load( './models/MissileLauncherP1.dae', function ( collada ) {
			var p1 = collada.scene;
			p1.traverse( function ( child ) {
				if ( child instanceof THREE.SkinnedMesh ) {
						var animation = new THREE.Animation( child, child.geometry.animation );
						animation.play();
					}
			});
			// launcher.position.set(0,0,0);
			p1.scale.set(20,20,20);
			p1.rotation.x = 0;

			// scene.add(p1);

			//加载导弹发射架的第二个部分
			loader.load( './models/MissileLauncherP2.dae', function ( collada ) {
				var p2 = collada.scene;
				p2.traverse( function ( child ) {
					if ( child instanceof THREE.SkinnedMesh ) {
							var animation = new THREE.Animation( child, child.geometry.animation );
							animation.play();
						}
				});
				p2.scale.set(20,20,20);
				p2.rotation.x = 0;

				missileLauncher.add(p1);
				missileLauncher.add(p2);
				// missileLauncher.add(baseMesh);
				// scene.add(missileLauncher);

				//加载服务的模型
				loader.load( './models/glados.dae', function ( collada ) {
					serviceMesh = collada.scene;
					serviceMesh.traverse( function ( child ) {
						if ( child instanceof THREE.SkinnedMesh ) {
							var animation = new THREE.Animation( child, child.geometry.animation );
							animation.play();
						}
					});
					serviceMesh.scale.set(0.6,0.6,0.6);
					serviceMesh.position.add(serviceOffset);

					//加载导弹  模型和发射架的第二个部分其实是一样的，但是角度不同。为了方便还是重新加载另外一个
					loader.load( './models/missile.dae', function ( collada ) {
						missileDae = collada.scene;
						missileDae.traverse( function ( child ) {
							if ( child instanceof THREE.SkinnedMesh ) {
									var animation = new THREE.Animation( child, child.geometry.animation );
									animation.play();
								}
						});
						missileDae.scale.set(10,10,10);
						missileDae.rotation.x = 0;

						initTeams (teamsOption.num);

					}, onProgress, onError);

				}, onProgress, onError);

			}, onProgress, onError);

		}, onProgress, onError);
		


		// grid

		var size = 100, step = 50;

		var geometry = new THREE.Geometry();

		for ( var i = - size; i <= size; i += step ) {

			geometry.vertices.push( new THREE.Vector3( - size, i, 0 ) );
			geometry.vertices.push( new THREE.Vector3(   size, i, 0 ) );

			geometry.vertices.push( new THREE.Vector3( i, - size, 0 ) );
			geometry.vertices.push( new THREE.Vector3( i,   size, 0 ) );

		}

		var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2, transparent: true } );

		var line = new THREE.LineSegments( geometry, material );
		// scene.add( line );

		//



		// Lights

		var ambientLight = new THREE.AmbientLight( 0x606060 );
		scene.add( ambientLight );

		var directionalLight = new THREE.DirectionalLight( 0xffffff );
		directionalLight.position.set( 0, -0.75, -0.5 ).normalize();
		scene.add( directionalLight );

		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setClearColor( 0x111111);
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( renderer.domElement );

		//

		window.addEventListener( 'resize', onWindowResize, false );

	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );

	}


	function animate() {

		requestAnimationFrame( animate );
		render();

	}


	function render() {

		controls.update();
		TWEEN.update();
		stats.update();
		renderer.render( scene, camera );

	}

	function isReady(){
		return ready;
	}



	return {
		init : function(){
			init();
			animate();
		},
		attack : function( attacker , defender , serviceNum, time ){
			attack( attacker , defender , serviceNum, time );
		},
		isReady : function(){
			return isReady();
		}
	};
}();
