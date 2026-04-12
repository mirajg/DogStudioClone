
import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGLTF } from '@react-three/drei'
import { DirectionalLight } from 'three'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useAnimations } from '@react-three/drei'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

const Dog = ({ fetchImg, sec3 }) => {

    gsap.registerPlugin(useGSAP);
    gsap.registerPlugin(ScrollTrigger);

    let model = useGLTF("/models/dog.drc.glb");

    let textures = useTexture({
        normalMap: "/models/dog_normals.jpg"
    })

    const [
        mat1,
        mat2
    ] = (useTexture(["/pictures/mat-1.png",
        "/pictures/mat-2.png"])).map(texture => {
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture
        })

    textures.colorSpace = THREE.SRGBColorSpace;


    let { actions } = useAnimations(model.animations, model.scene);

    useEffect(() => {
        actions["Take 001"].play();
    }, [actions])

    const material = useRef({
        uMatcap1: { value: mat1 },
        uMatcap2: { value: mat2 },
        uProgress: { value: 0.0 }
    })

    // 1. Create the material ONCE
    const sharedMaterial = new THREE.MeshMatcapMaterial({
        matcap: mat1,
        normalMap: textures.normalMap,
    });

    function onBeforeCompile(shader) {
        shader.uniforms.uMatcapTexture1 = material.current.uMatcap1
        shader.uniforms.uMatcapTexture2 = material.current.uMatcap2
        shader.uniforms.uProgress = material.current.uProgress

        // Store reference to shader uniforms for GSAP animation

        shader.fragmentShader = shader.fragmentShader.replace(
            "void main() {",
            `
        uniform sampler2D uMatcapTexture1;
        uniform sampler2D uMatcapTexture2;
        uniform float uProgress;

        void main() {
        `
        )

        shader.fragmentShader = shader.fragmentShader.replace(
            "vec4 matcapColor = texture2D( matcap, uv );",
            `
          vec4 matcapColor1 = texture2D( uMatcapTexture1, uv );
          vec4 matcapColor2 = texture2D( uMatcapTexture2, uv );
          
          float progress = clamp(uProgress, 0.0, 1.0);

          vec4 matcapColor = mix(matcapColor2, matcapColor1, progress );
        `
        )
    }

    sharedMaterial.onBeforeCompile = onBeforeCompile;

    // 2. Assign the SAME material to every mesh
    model.scene.traverse((child) => {
        // console.log(child);
        if (child.isMesh) {
            // Dispose of the old material to prevent memory leaks
            child.material.dispose();

            child.material = sharedMaterial;
        }
    });

    const dogModel = useRef(model);

    const { camera, gl } = useThree();

    useEffect(() => {
        camera.position.z = 1.5;
    }, [camera]);


    useGSAP(() => {
        const el = sec3.current;
        if (!el) return;

        const onEnter = () => gsap.to(material.current.uProgress, { value: 1.0, duration: 0.4 });
        const onLeave = () => gsap.to(material.current.uProgress, { value: 0.0, duration: 1 });

        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);

        return () => {
            el.removeEventListener("mouseenter", onEnter);
            el.removeEventListener("mouseleave", onLeave);
        };
    }, []);


    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            gl.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Initial call
        handleResize();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [camera, gl]);

    useGSAP(() => {

        let tl = gsap.timeline({
            scrollTrigger: {
                trigger: "#section-1",
                start: "top top",
                endTrigger: "#section-3",
                end: "bottom bottom",
                scrub: true,
            }

        })


        tl.to(dogModel.current.scene.position, {
            z: "-=0.5",
            y: "+=0.2"
        }).to(dogModel.current.scene.rotation, {
            x: "+=0.20"
        }).to(dogModel.current.scene.rotation, {
            y: `-=${Math.PI}`
        }, 'same').to(dogModel.current.scene.position, {
            x: "-=1.5",
            z: "+=0.5",
            y: "-=0.2"
        }, 'same')

    })

    return (
        <> 
            {/* <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color={0x00ff00} />
            </mesh> */}
            <primitive object={model.scene} scale={2.2} position={[0.5, -1, 0]} rotation={[0, 0.7, 0]} />
            <directionalLight position={[0, 5, 5]} intensity={100} />
            {/* <OrbitControls autoRotate={false} /> */}
        </>
    )
}

export default Dog