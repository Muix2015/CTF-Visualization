

	var container;
	var camera, scene, renderer;
	var RAD_90  = 90/180*Math.PI;            					//90度的弧度值，后面会多次用到 定义为变量减少运算

	var teamMesh, teamMaterial;

	var missileDae;

	var missileLauncher = new THREE.Group();					//发射架组，发射架的模型有两个部分，会先添加进Group中再进行操作
	var teamFlag = new THREE.Group();                           //旗帜组  暂时没用到
	var baseMesh;                 								//发射架底部棱台
	var serviceMesh;                                            //周围的服务

	//初始方向向量   用于计算角度
	var missileVec 	= new THREE.Vector3(1,0,0);
	var launcherVec = new THREE.Vector3(0,-1,0);

	//偏移量   模型加载进来时的位置可能并不是在坐标原点，需要通过偏移量调整
	var baseOffset = new THREE.Vector3(0,0,-60);
	var serviceOffset =  new THREE.Vector3(0,0,0);
	var logoOffset = new THREE.Vector3(0,0,330);
	var cameraOffset = new THREE.Vector3(100,100,100);

	//队伍数据数组,会保存每个队伍的模型和信息(如血量)
	var teamsData = [];

	var clock = new THREE.Clock(true),options, spawnerOptions, particleSystem,tick=0;

	init();
	animate();


	/*
	 * 攻击函数
	 * @param startTeam 	攻击方
	 * @param endTeam 		防守方
	 * @param serviceNum    被攻击的服务编号
	 * @param time          导弹飞行时间
	 */
	function attack( startTeam , endTeam , serviceNum, time ){

		var missile = missileDae.clone();
		var quaternion = new THREE.Quaternion();
		var rotation = new THREE.Euler();

		var startPos 	= 	startTeam.launcher.position;
		var endPos 		= 	endTeam.services[serviceNum].position;
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

		var geometry = new THREE.Geometry();
		geometry.vertices = trajectory.curve.getPoints(50);
		var material = new THREE.LineBasicMaterial({color : 0xee00ee});
		var line = new THREE.Line(geometry, material);

		scene.add( line );


		var tangent; 

		//发射导弹
		var launch = new TWEEN.Tween( trajectory )
												.to({pos:1},time)
												.onStart(function(){
													scene.add(missile);
													startTeam.launcher.children[1].visible = false;         
												})
												.onUpdate(function(){
											
													missile.position.copy(trajectory.curve.getPointAt(trajectory.pos));  	//获取位置
													tangent = trajectory.curve.getTangentAt(trajectory.pos).normalize();    //获取导弹轨迹曲线的切向方向向量
													quaternion.setFromUnitVectors(missileVec , tangent);                    //根据切向向量和导弹初始方向向量计算四元数
													rotation.setFromQuaternion(quaternion,'XYZ');							//将四元数转换成欧拉角
													missile.rotation.set(rotation.x,rotation.y,rotation.z);
													
													// camera.position.copy(trajectory.curve.getPointAt(trajectory.pos)).add(cameraOffset);
													// camera.lookAt(missile.position);
													// particle(trajectory.pos*10);

												})
												.onComplete(function(){
													scene.remove(missile);
													missile = null;
													scene.remove(line);
													line = null;
													startTeam.launcher.children[1].visible = true;
												});
		var rot = launcherVec.angleTo(targetVec);

		// rot = dy > 0 ? -rot : dy==0 ? dx<0 ? -rot : rot : rot;	
		rot = dx > 0 ?rot :-rot;	//修正旋转角度


		//旋转发射架 对准目标
		var aim = new TWEEN.Tween( startTeam.launcher.rotation )
												.to({z:rot},500)
												.onComplete(function(){
													launch.start();				//旋转完成后发射
												})
												.start();

	}



	/*
	 * 进攻测试   随机选取进攻队伍和防守队伍
	 */
	function attactTest(){
		var startIndex = Math.ceil(Math.random()*15);
		var endIndex;
		do{
			endIndex = Math.ceil(Math.random()*15);
		}while(endIndex == startIndex);
		var serviceNum = Math.ceil(Math.random()*4);
		attack(teamsData[startIndex],teamsData[endIndex],serviceNum,1800);		
		var time = Math.ceil(Math.random()*3000);
		setTimeout(attactTest,time);		//间隔一段时间后再次调用此函数
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



	function init() {

		container = document.createElement( 'div' );
		document.body.appendChild( container );

		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100000 );
		camera.position.set( 0, -280, 200 );
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

		particleSystem = new THREE.GPUParticleSystem({
			maxParticles: 250000
		});
		scene.add( particleSystem);


		//options passed during each spawned
		options = {
			position: new THREE.Vector3(),
			positionRandomness: 0.8,
			velocity: new THREE.Vector3(),
			velocityRandomness: 1,
			color: 0xaa88ff,
			colorRandomness: 0,
			turbulence: .5,
			lifetime: 10,
			size: 5,
			sizeRandomness: 10
		};

		spawnerOptions = {
			spawnRate: 150,
			horizontalSpeed: 50.5,
			verticalSpeed: 50.33,
			timeScale: 7
		}

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

		var baseGeo = new THREE.CylinderGeometry(30, 40, 40, 5, 3);
		var baseMaterial = new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } );
		var baseMesh = new THREE.Mesh( baseGeo, baseMaterial );
		baseMesh.rotation.x = -RAD_90;
		baseMesh.position.z = -60;



		//宇宙天空盒

		var r = "img/skybox1/";
		var urls = [ r + "px.jpg", r + "nx.jpg",
					 r + "py.jpg", r + "ny.jpg",
					 r + "pz.jpg", r + "nz.jpg" ];


		// var r = "img/skybox/";
		// var urls = [ r + "px.jpg", r + "nx.jpg",
		// 			 r + "nz.jpg", r + "pz.jpg",
		// 			 r + "py.jpg", r + "ny.jpg" ];

		scene.add( makeSkybox( urls, 50000 ) );



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
			// scene.add(flag);
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


			var logoTexture =	THREE.ImageUtils.loadTexture('img/logo/'+(num+1)+'.png');			
			var logoGeo =new THREE.BoxGeometry(300,0.1,200);
			var logoMat = new THREE.MeshBasicMaterial( {map : logoTexture} );
			logoMat.transparent=true;
			logoMat.opacity= 0.4;
			var logo = new THREE.Mesh( logoGeo, logoMat );
			logo.position.copy(position).add(logoOffset);
			scene.add(logo);

			return obj = {
				launcher:teamLauncherMesh,							//导弹发射架
				services:servicesArr,                   			//服务
				base:teamBaseMesh,                               	//发射架下方的棱台
				logo:null,                          				//队伍LOGO 将来用于保存图片文件路径或名字
				HP:100,                                        		//总血量
				currentHP:100,                     					//当前血量
				position:teamLauncherMesh.position              	//位置
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
			p1.scale.set(10,10,10);
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
				p2.scale.set(10,10,10);
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
					serviceMesh.scale.set(0.3,0.3,0.3);
					serviceMesh.position.add(serviceOffset);


					// new TWEEN.Tween(serviceMesh.position).to({z: 10},300).repeat( Infinity ).yoyo(true).start();

					var sphereGeo =new THREE.SphereGeometry(80,30);
					var sphereMat = new THREE.MeshBasicMaterial( { color : 0xff0000 } );
					// sphereMat.transparent=true;
					// sphereMat.opacity=0.6;
					var sphere = new THREE.Mesh( sphereGeo, sphereMat );

					// new TWEEN.Tween(sphere.material).to({opacity: 0.3},300).repeat( 10 ).yoyo(true).onComplete(function(){scene.remove(sphere);}).start();

					console.log(sphere);
					// scene.add(sphere);

					var innerOrbit = new THREE.EllipseCurve(
						0, 0,            
						1300, 1300,          
						0,  2*Math.PI,  
						false,            
						0                
					);

					var outerOrbit = new THREE.EllipseCurve(
						0, 0,            
						2500, 2500,          
						0,  2*Math.PI,  
						false,            
						0                
					);

					var inc =0;
					var teamPosition =  new THREE.Vector3( 0, 0, 0 );
					
					// teamsData[0] = constructTeamObject( 0, teamPosition );

					for(var i=0;i<5;i++){
						teamPosition = new THREE.Vector3(
								innerOrbit.getPointAt(inc).x ,
								innerOrbit.getPointAt(inc).y ,
								0
							);
						teamsData[i] = constructTeamObject(i,teamPosition);

						inc += 0.2;
					}

					inc = 0;

					for(var i=5;i<16;i++){
						teamPosition = new THREE.Vector3(
								outerOrbit.getPointAt(inc).x ,
								outerOrbit.getPointAt(inc).y ,
								0
							);
						teamsData[i] = constructTeamObject(i,teamPosition);

						inc += 0.090909;
					}



					// for(var i=5;i<16;i++){

					// 	var position = new THREE.Vector3(-1350+(i%4)*900,-1350+Math.floor(i/4)*900,0);
					// 	teamsData[i] = constructTeamObject(i,position);

					// }

					attactTest();

				}, onProgress, onError);

			}, onProgress, onError);

		}, onProgress, onError);
		
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
		var delta = clock.getDelta() * spawnerOptions.timeScale;
		
		tick += delta;

		if (tick < 0) tick = 0;

		if (delta > 0) {
			// options.position.x = Math.sin(tick * spawnerOptions.horizontalSpeed) * 20;
			// options.position.y = Math.sin(tick * spawnerOptions.verticalSpeed) * 10;
			options.position.z = Math.sin(tick * spawnerOptions.horizontalSpeed + spawnerOptions.verticalSpeed) * 5;

			// options.position.x += 0.1;

			for (var x = 0; x < spawnerOptions.spawnRate * delta; x++) {
				// Yep, that's really it.	Spawning particles is super cheap, and once you spawn them, the rest of
				// their lifecycle is handled entirely on the GPU, driven by a time uniform updated below
				particleSystem.spawnParticle(options);
			}
		}
	

		particleSystem.update(tick);

		render();

	}


	function render() {

		controls.update();
		TWEEN.update();
		stats.update();
		renderer.render( scene, camera );

	}

