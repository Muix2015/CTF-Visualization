/**
 * @author hujiulong / http://hujiulong.com/
 */

var XCTF = function () {

    if ( !Detector.webgl ) Detector.addGetWebGLMessage();

    var VERSION = "1.0.0";

    var options = {

        callback: null,
        progress: {
            set: null,
            remove: null
        }

    };

    var container;
    var camera, scene, renderer, controls;

    var CAMERA_STATIC = 0, //静止
        CAMERA_FREE = 1, //自由视角
        CAMERA_CW = 2, //顺时针旋转
        CAMERA_CCW = 3; //逆时针旋转

    var currentMode = CAMERA_CCW;

    var guiOption = {

        mode: CAMERA_CCW,
        logoAdjust: true,
        displayFps: false,
        displayUI: true,
        fullscreen: fullscreen,
        clearData: clearData

    };

    var cameraInitPos = new THREE.Vector3( 0, 3000, 5500 ); //相机初始位置
    var cameraInitRot = new THREE.Euler(); //初始角度
    var cameraRotRadius = cameraInitPos.z;

    var centerMesh; //发射架组，发射架的模型有两个部分，会先添加进Group中再进行操作
    var shieldMesh;
    var serviceMesh; //周围的服务

    //初始方向向量   用于计算角度
    var logoVec = new THREE.Vector3( 0, 0, 1 );
    var centerVec = new THREE.Vector3( 0, 0, 1 );
    var serviceVec = new THREE.Vector3( 0, 0, -1 );

    //偏移量   模型加载进来时的位置可能并不是在坐标原点，需要通过偏移量调整
    var serviceOffset = new THREE.Vector3( 0, 0, 0 );
    var logoOffset = new THREE.Vector3( 0, 400, 0 );

    var cameraFocus = new THREE.Vector3( 0, -100, 0 );


    //队伍数据数组,会保存每个队伍的模型和信息( 如血量 )
    var teamsData = [];
    var particleSystems = [];
    var teamLogos = [];

    /*
     * 攻击函数
     * @param attackerNumber    攻击方编号( 1-N )
     * @param defenderNumber    防守方编号( 1-N )
     * @param serviceNum    被攻击的服务编号( 1-4 )
     * @param status        攻击结果
     */
    function attack( attackerNumber, defenderNumber, serviceNum, status ) {

        var attacker = teamsData[ attackerNumber - 1 ];
        var defender = teamsData[ defenderNumber - 1 ];

        var time = 3600;

        var quaternion = new THREE.Quaternion();
        var rotation = new THREE.Euler();

        var startPos = attacker.launcher.position;
        var endPos = defender.services[ serviceNum - 1 ].position;
        var dx = endPos.x - startPos.x;
        var dz = endPos.z - startPos.z;
        var d = Math.sqrt( dx * dx + dz * dz );

        var targetVec = new THREE.Vector3( dx, 0, dz ); //指向目标的方向向量

        //轨迹  curve是轨迹的曲线   pos会用于后面tween中的计算
        var trajectory = {
            curve: new THREE.CatmullRomCurve3( [
                new THREE.Vector3( startPos.x, 0, startPos.z ),
                new THREE.Vector3( startPos.x + dx / 3, d / 4, startPos.z + dz / 3 ),
                new THREE.Vector3( endPos.x - dx / 3, d / 4, endPos.z - dz / 3 ),
                new THREE.Vector3( endPos.x, 50, endPos.z )
            ] ),
            pos: 0
        };

        var rot = centerVec.angleTo( targetVec );

        rot = dx > 0 ? rot : -rot; //修正旋转角度

        //旋转发射架 对准目标
        var aim = new TWEEN.Tween( attacker.launcher.rotation )
            .to( { y: rot }, 500 )
            .onComplete( function () {
                startParticles( defenderNumber, serviceNum, status, trajectory.curve, time );
            } )
            .start();

    }


    function initGUI() {

        var gui = new dat.GUI();

        gui.add( guiOption, 'mode', {
            '静止': CAMERA_STATIC,
            '顺时针旋转': CAMERA_CW,
            '逆时针旋转': CAMERA_CCW,
            '鼠标自由控制': CAMERA_FREE
        } )

        .onChange( function () {

            if ( currentMode == CAMERA_FREE ) {

                camera.lookAt( cameraFocus );
                camera.position.copy( cameraInitPos );
                camera.rotation.copy( cameraInitRot );
                camera.up.set( 0, 1, 0 );
                logoAdjust();

            }

            if ( guiOption.mode != CAMERA_FREE ) {
                controls.enabled = false;
            } else {
                controls.target.copy( cameraFocus );
                controls.enabled = true;
            }

            currentMode = guiOption.mode;

        } ).name( '镜头模式' );

        gui.add( guiOption, 'logoAdjust' ).name( '旗帜始终朝向镜头' );

        gui.add( guiOption, 'displayFps' )
            .onChange( function () {
                var val = guiOption.displayFps ? '' : 'none';
                document.getElementById( 'fps' ).style.display = val;
            } ).name( '显示FPS' );

        gui.add( guiOption, 'displayUI' )
            .onChange( function () {
                var val = guiOption.displayUI ? '' : 'none';
                var tables = document.getElementsByClassName( 'ui' );
                for ( var i = 0; i < tables.length; i++ ) {
                    tables[ i ].style.display = val;
                }
            } ).name( '显示数据' );

        gui.add( guiOption, 'clearData' ).name( '清除历史数据' );

        gui.add( guiOption, 'fullscreen' ).name( '全屏' );

        gui.close();

        gui.domElement.parentNode.style.zIndex = 1000;

    }

    function initStats() {

        stats = new Stats();
        stats.domElement.id = 'fps';
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '2px';
        stats.domElement.style.left = '';
        stats.domElement.style.display = 'none';
        container.appendChild( stats.domElement );

    }

    function initSkybox() {

        var size = 50000;

        var r = "img/skybox/";
        var urls = [
            r + "px.jpg", r + "nx.jpg",
            r + "py.jpg", r + "ny.jpg",
            r + "pz.jpg", r + "nz.jpg"
        ];

        var skyboxCubemap = new THREE.CubeTextureLoader().load( urls );

        skyboxCubemap.format = THREE.RGBFormat;
        var skyboxShader = THREE.ShaderLib[ 'cube' ];
        skyboxShader.uniforms[ 'tCube' ].value = skyboxCubemap;

        var skybox = new THREE.Mesh(
            new THREE.BoxGeometry( size, size, size ),
            new THREE.ShaderMaterial( {
                fragmentShader: skyboxShader.fragmentShader,
                vertexShader: skyboxShader.vertexShader,
                uniforms: skyboxShader.uniforms,
                depthWrite: false,
                side: THREE.BackSide
            } )
        );

        scene.add( skybox );
    }


    function initTeams() {

        shieldMesh = new THREE.Mesh(
            new THREE.SphereGeometry( 200, 32, 32 ),
            new THREE.MeshPhongMaterial( { color: 0x00aaff, shininess: 10, opacity: 0.3, transparent: true } )
        );

        var progressValue = [ 0, 0 ];

        var onError = function ( xhr ) {};

        var manager = new THREE.LoadingManager( function () {

            constructTeams( teamsOption.teamNum );

            if ( !!options.progress.remove && typeof options.progress.remove === 'function' ) {
                options.progress.remove();
            }

        } );

        var loader = new THREE.ColladaLoader( manager );

        loader.load( './models/service.dae', function ( collada ) {

            serviceMesh = collada.scene;
            serviceMesh.scale.set( 0.1, 0.1, 0.1 );
            serviceMesh.position.add( serviceOffset );
            serviceMesh.rotation.set( 0, 0, 0 );

        }, function ( xhr ) {

            progressValue[ 0 ] = xhr.loaded / xhr.total * 50;

            if ( !!options.progress.set && typeof options.progress.set === 'function' ) {
                console.log( progressValue[ 0 ] + progressValue[ 1 ] )
                options.progress.set( progressValue[ 0 ] + progressValue[ 1 ] );
            }

        }, onError );

        loader.load( './models/center.dae', function ( collada ) {

            centerMesh = collada.scene;
            centerMesh.scale.set( 25, 45, 25 );
            centerMesh.rotation.set( 0, 0, 0 );

        }, function ( xhr ) {

            progressValue[ 1 ] = xhr.loaded / xhr.total * 50;

            if ( !!options.progress.set && typeof options.progress.set === 'function' ) {
                // console.log( progressValue[ 0 ] + progressValue[ 1 ] );
                options.progress.set( progressValue[ 0 ] + progressValue[ 1 ] );
            }

        }, onError );
    }

    function constructTeams( num ) {

        var positionData = AllTeamsPositionData[ num ];

        for ( var i = 0; i < num; i++ ) {
            teamsData[ i ] = constructTeamObject( i, positionData[ i ] );
        }

        if ( !!options.callback ) {
            options.callback();
        }

    }

    function initparticleSystems() {

        var materials = [];


        var material = new THREE.SpriteMaterial( {

            map: new THREE.CanvasTexture( createParticleCanvas( [ {
                stop: 0,
                color: 'rgba( 255, 255, 255, 1 )'
            }, {
                stop: 0.2,
                color: 'rgba( 0, 255, 255, 1 )'
            }, {
                stop: 0.4,
                color: 'rgba( 0, 64, 0, 1 )'
            }, {
                stop: 1,
                color: 'rgba( 0, 0, 0, 1 )'
            } ] ) ),

            blending: THREE.AdditiveBlending

        } );

        materials.push( material );

        var material = new THREE.SpriteMaterial( {

            map: new THREE.CanvasTexture( createParticleCanvas( [ {
                stop: 0,
                color: 'rgba( 255, 255, 255, 1 )'
            }, {
                stop: 0.2,
                color: 'rgba( 0, 255, 255, 1 )'
            }, {
                stop: 0.4,
                color: 'rgba( 0, 0, 64, 1 )'
            }, {
                stop: 1,
                color: 'rgba( 0, 0, 0, 1 )'
            } ] ) ),

            blending: THREE.AdditiveBlending

        } );

        materials.push( material );

        for ( var i = 0; i < 20; i++ ) {

            var particleArr = {
                available: true,
                particles: []
            };

            for ( var j = 0; j < 60; j++ ) {

                var particle = new THREE.Sprite( materials[ i % 2 ] );
                particle.pos = 0;
                particle.visible = false;
                particleArr.particles.push( particle );
                scene.add( particle );

            }

            particleSystems.push( particleArr );

        }
    }

    function createParticleCanvas( colorArr ) {

        var canvas = document.createElement( 'canvas' );
        canvas.width = 16;
        canvas.height = 16;
        var context = canvas.getContext( '2d' );
        var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );

        colorArr.forEach( function ( item ) {

            gradient.addColorStop( item.stop, item.color );

        } );

        context.fillStyle = gradient;
        context.fillRect( 0, 0, canvas.width, canvas.height );

        return canvas;

    }



    function startParticles( defenderNumber, serviceNum, status, curve, time ) {

        var defender = teamsData[ defenderNumber - 1 ];
        var position = defender.position;
        var targetService = defender.services[ serviceNum - 1 ];
        var shieldSphere = new THREE.Sphere( position, 430 );

        for ( var i = 0; i < particleSystems.length; i++ ) {
            if ( particleSystems[ i ].available ) {

                var particleSystem = particleSystems[ i ];
                particleSystem.available = false;

                var firstParticle = particleSystem.particles[ 0 ];
                var lastParticle = particleSystem.particles[ particleSystem.particles.length - 1 ];

                for ( var j = 0; j < particleSystem.particles.length; j++ ) {

                    var particle = particleSystem.particles[ j ];
                    particle.scale.set( 60 - j, 60 - j, 0 );
                    new TWEEN.Tween( particle )
                        .delay( j * 10 )
                        .to( { pos: 1 }, 1800 )
                        .onStart( function () {
                            var point = curve.getPointAt( 0 );
                            this.position.copy( point );
                            this.visible = true;
                        } )
                        .onUpdate( function () {

                            var point = curve.getPointAt( this.pos );
                            this.position.copy( point );
                            if ( !status ) {
                                if ( !this.visible )
                                    return;
                                if ( point.distanceTo( targetService.position ) < 200 ) {
                                    this.visible = false;
                                    targetService.shield.material.opacity += 0.007;
                                    if ( this === firstParticle ) {
                                        targetService.shield.material.opacity = 0.1;
                                        targetService.shield.visible = true;
                                    }
                                    if ( this === lastParticle ) {
                                        new TWEEN.Tween( targetService.shield.material )
                                            .to( { opacity: 0 }, 800 )
                                            .onComplete( function () {
                                                targetService.shield.visible = false;
                                            } )
                                            .start();
                                    }
                                }
                            }
                        } )
                        .onComplete( function () {
                            this.pos = 0;
                            this.visible = false;
                            if ( this === firstParticle ) {

                                if ( status ) {

                                    new TWEEN.Tween( targetService.children[ 0 ].children[ 1 ].material.color )
                                        .to( { r: 0.8, g: 0, b: 0 }, 300 )
                                        .yoyo( true )
                                        .repeat( 1 )
                                        .onComplete( function () {
                                            this.setRGB( 0.9, 0.9, 0.9 ); //还原颜色。虽然yoyo模式会自动还原，但某些特殊情况下不会还原
                                        } )
                                        .start();
                                }

                            } else if ( this === lastParticle ) {
                                particleSystem.available = true;
                            }
                        } )
                        .start();
                }
                break;
            }
        }

    }


    /*
     * 构造队伍的模型，包括导弹发射架及五个服务的模型
     * @param  num         编号
     * @param  position    位置
     * @return obj         包含队伍所有模型及信息的对象
     */
    function constructTeamObject( num, position ) {

        var center = centerMesh.clone();
        // var shield =    shieldMesh.clone();
        // shield.material = shieldMesh.material.clone();

        center.position.copy( position );
        // shield.position.copy( position );
        // shield.visible = false;

        scene.add( center );
        // scene.add( shield );

        var orbit = new THREE.EllipseCurve(
            position.x, position.z,
            400, 400,
            0, 2 * Math.PI,
            false,
            0
        );

        var pos = 0;
        var servicesArr = [];
        for ( var i = 0; i < teamsOption.serviceNum; i++ ) {
            var service = serviceMesh.clone();
            service.shield = shieldMesh.clone();
            service.shield.visible = false;

            service.shield.material = shieldMesh.material.clone();
            service.children[ 0 ].children[ 1 ].material = serviceMesh.children[ 0 ].children[ 1 ].material.clone();
            service.position.x = orbit.getPointAt( pos ).x;
            service.position.z = orbit.getPointAt( pos ).y;
            service.position.add( serviceOffset );
            service.rotation.y = 0;
            service.shield.position.copy( service.position );
            scene.add( service.shield );

            var vec = new THREE.Vector3( service.position.x - position.x, service.position.y - position.y, service.position.z - position.z ).normalize();
            var rot = serviceVec.angleTo( vec );
            var
                rot = service.position.x - position.x < 0 ? rot : -rot;
            // rot = dy > 0 ? -rot : dy==0 ? dx<0 ? -rot : rot : rot;
            service.rotation.y = rot;
            new TWEEN.Tween( service.position ).to( { y: 10 }, 1000 ).delay( Math.random() * 500 ).repeat( Infinity ).yoyo( true ).start();
            servicesArr.push( service );
            scene.add( service );
            pos += 1 / teamsOption.serviceNum;
        }

        var logoTexture = THREE.ImageUtils.loadTexture( teamsOption.logoPath + teamsOption.teamData[ num ].logo );
        var logoWidth = 0,
            logoHeight = 0;

        if ( teamsOption.logoSize.w > teamsOption.logoSize.h ) {
            logoWidth = 320;
            logoHeight = 320 * teamsOption.logoSize.h / teamsOption.logoSize.w;
        } else {
            logoHeight = 320;
            logoWidth = 320 * teamsOption.logoSize.h / teamsOption.logoSize.w;
        }

        var logoGeo = new THREE.BoxGeometry( logoWidth, logoHeight, 0.1 );
        var logoMat = new THREE.MeshBasicMaterial( { map: logoTexture } );
        logoMat.transparent = true;
        logoMat.opacity = 0.7;
        var logo = new THREE.Mesh( logoGeo, logoMat );
        logo.position.copy( position ).add( logoOffset );
        teamLogos.push( logo );
        scene.add( logo );

        return {
            number: teamsOption.teamData[ num ].num, //队伍编号
            name: teamsOption.teamData[ num ].name, //队伍名称
            launcher: center, //导弹发射架
            services: servicesArr, //服务
            logo: logo, //队伍LOGO 将来用于保存图片文件路径或名字
            HP: 100, //总血量
            currentHP: 100, //当前血量
            position: center.position //位置
        };

    }


    function init() {

        container = document.createElement( 'div' );
        document.body.appendChild( container );

        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 100000 );
        camera.position.copy( cameraInitPos );
        camera.lookAt( cameraFocus );
        cameraInitRot.copy( camera.rotation );


        scene = new THREE.Scene();

        controls = new THREE.TrackballControls( camera, container );
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.enabled = false;
        controls.target.copy( cameraFocus );

        initGUI();
        initStats();
        initSkybox();
        initparticleSystems();
        initTeams();


        // Lights

        var ambientLight = new THREE.AmbientLight( 0x606060 );
        scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( -0.2, 0.5, 0.75 ).normalize();
        scene.add( directionalLight );

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setClearColor( 0x111111 );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        //

        window.addEventListener( 'resize', onWindowResize, false );

        console.log( "version ", VERSION );

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function cameraHandle( type ) {

        if ( type == CAMERA_FREE ) {

            controls.update();

        } else if ( type == CAMERA_CW || type == CAMERA_CCW ) {

            var flag = type == CAMERA_CW ? -1 : 1;
            var timer = Date.now() * 0.00003;
            camera.position.x = flag * Math.cos( timer ) * cameraRotRadius;
            camera.position.y = cameraInitPos.y;
            camera.position.z = Math.sin( timer ) * cameraRotRadius;
            camera.lookAt( cameraFocus );

        }

        if ( guiOption.logoAdjust && guiOption.logoAdjust != CAMERA_STATIC ) {

            logoAdjust();

        }

    }

    function logoAdjust() {

        var rot = logoVec.angleTo( new THREE.Vector3( camera.position.x, 0, camera.position.z ).normalize() );
        rot = camera.position.x > 0 ? rot : -rot;

        for ( var i = 0; i < teamLogos.length; i++ ) {
            teamLogos[ i ].rotation.y = rot; //在旋转时旗帜一直朝向镜头
        }

    }

    function fullscreen() {

        if ( document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen ) {

            if ( document.exitFullscreen ) {

                document.exitFullscreen();

            } else if ( document.mozCancelFullScreen ) {

                document.mozCancelFullScreen();

            } else if ( document.webkitCancelFullScreen ) {

                document.webkitCancelFullScreen();

            } else if ( document.msExitFullscreen ) {

                document.msExitFullscreen();

            }

        } else {

            var docElm = document.documentElement;

            if ( docElm.requestFullscreen ) {

                docElm.requestFullscreen();

            } else if ( docElm.mozRequestFullScreen ) {

                docElm.mozRequestFullScreen();

            } else if ( docElm.webkitRequestFullScreen ) {

                docElm.webkitRequestFullScreen();

            } else if ( elem.msRequestFullscreen ) {

                elem.msRequestFullscreen();

            }

        }
    }

    function clearData() {

        $( '.count' ).text( 0 );
        $( '.flag' ).text( 0 );
        $( '.score' ).text( 0 );
        $( '.num1' ).text( 0 );
        $( '.num2' ).text( 0 );
        $( '.num3' ).text( 0 );

    }


    function animate() {

        requestAnimationFrame( animate );
        render();

    }



    function render() {

        cameraHandle( currentMode );
        TWEEN.update();
        stats.update();
        renderer.render( scene, camera );

    }


    return {
        init: function ( optionObject ) {

            for ( var name in options ) {

                if ( !!optionObject[ name ] ) {

                    options[ name ] = optionObject[ name ];

                }

            }

            init();
            animate();

        },
        attack: function ( attacker, defender, serviceNum, status ) {
            attack( attacker, defender, serviceNum, status );
        }
    };
}();
