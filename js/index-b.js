

	var container;
	var camera, scene, renderer;
	var RAD_90  = 90/180*Math.PI;            					//90度的弧度值，后面会多次用到 定义为变量减少运算

	var teamMesh, teamMaterial;

	var missileDae;
	var clock = new THREE.Clock();

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

	//队伍数据数组,会保存每个队伍的模型和信息(如血量)
	var teamsData = [];
	var sphereMaterial;


	init();
	animate();
 	




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
		camera.position.set( 0, -2800, 2000 );
		camera.rotation.x = RAD_90;
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

		// roll-over helpers

		teamGeo      = new THREE.BoxGeometry( 50, 50, 50 );
		teamMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
		teamMesh     = new THREE.Mesh( teamGeo, teamMaterial );

		var baseGeo      = new THREE.CylinderGeometry(80, 120, 120, 5, 3);
		var baseMaterial = new THREE.MeshPhongMaterial( { color: 0xe0e0e0 } );
		var baseMesh     = new THREE.Mesh( baseGeo, baseMaterial );
		baseMesh.rotation.x = -RAD_90;
		baseMesh.position.z = -60;





		var r = "img/skybox1/";
		var urls = [ r + "px.jpg", r + "nx.jpg",
					 r + "py.jpg", r + "ny.jpg",
					 r + "pz.jpg", r + "nz.jpg" ];


		// var r = "img/skybox/";
		// var urls = [ r + "px.jpg", r + "nx.jpg",
		// 			 r + "nz.jpg", r + "pz.jpg",
		// 			 r + "py.jpg", r + "ny.jpg" ];
		scene.add( makeSkybox( urls, 50000 ) );




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

		var geometry = new THREE.SphereGeometry( 300, 32, 16 );
		sphereMaterial = new THREE.MeshBasicMaterial( { color: 0x00aaff,  shininess: 10, opacity: 0.3, transparent: true } );
		var mesh = new THREE.Mesh( geometry, sphereMaterial );
		scene.add(mesh);
 		

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
				missileLauncher.add(baseMesh);
				scene.add(missileLauncher);

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
					var orbit = new THREE.EllipseCurve(
						0,  0,            
						200, 200,          
						0,  2*Math.PI,  
						false,            
						0                
					);
					var pos = 0;
					for(var i=0;i<5;i++){
						var service = serviceMesh.clone();
						service.position.x = orbit.getPointAt(pos).x;
						service.position.y = orbit.getPointAt(pos).y;
						service.position.add(serviceOffset);
						service.rotation.y = -i*2*Math.PI/5+RAD_90;
						scene.add(service);
						pos+=0.2;
					}

				}, onProgress, onError);

			}, onProgress, onError);

		}, onProgress, onError);
		

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
		var timer = 0.0001 * Date.now();
		sphereMaterial.opacity = 0.3 + 0.3 * Math.sin( 15 * timer );
		// console.log(sphereMaterial);
		controls.update();
		TWEEN.update();
		stats.update();
		renderer.render( scene, camera );

	}
