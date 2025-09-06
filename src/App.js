import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

function Coin({ result, flipping }) {
  const coinRef = useRef();
  const startTime = useRef(null);

  const caras = useLoader(THREE.TextureLoader, "./rebelion2.jpg");
  const cruces = useLoader(THREE.TextureLoader, "./imperio2.jpg");

  // Animación del flip
  useFrame(() => {
    if (flipping && coinRef.current) {
      coinRef.current.rotation.x += 0.4; // velocidad de giro
    }
  });

  useEffect(() => {
    if (!flipping && coinRef.current) {
      if (result === "Heads") {
        coinRef.current.rotation.x = 0; // cara arriba
      } else {
        coinRef.current.rotation.x = Math.PI;
      }
    }
  }, [flipping, result]);

  useFrame((state) => {
    if (flipping && coinRef.current) {
      if (!startTime.current) startTime.current = state.clock.elapsedTime;

      // Tiempo desde inicio
      const t = state.clock.elapsedTime - startTime.current;

      // Duración total del vuelo (en segundos)
      const duration = 2.4;

      if (t < duration) {
        // Rotación de la moneda
        coinRef.current.rotation.x += 0.4;

        // Movimiento en Y (parábola: un salto)
        const u = Math.min(1, t / duration); // normaliza de 0 a 1
        coinRef.current.position.y = 4 * u * (1 - u) * 2; // altura 2
      } else {
        // Fin del lanzamiento
        startTime.current = null;

        // Asegura que la moneda vuelve al suelo
        coinRef.current.position.y = 0;

        // Fija resultado final
        if (result === "Heads") {
          coinRef.current.rotation.set(0, 0, 0);
        } else {
          coinRef.current.rotation.set(Math.PI, 0, 0);
        }
      }
    }
  });

  return (
    <group ref={coinRef} rotation={[0, 0, 0]}>
      <mesh rotation={[0, 0, 0]} scale={[1, 1, 1]}>
        {/* Moneda (cilindro plano) */}
        <cylinderGeometry args={[1, 1, 0.1, 64]} />
        <meshStandardMaterial
          attach="material-0"
          metalness={0.9}
          color="#C0C0C0"
        />{" "}
        {/* Cara superior (Heads) */}
        <meshStandardMaterial
          attach="material-1"
          map={caras} /*color="#FFD700"*/
        />{" "}
        {/* Cara inferior (Tails) */}
        <meshStandardMaterial
          attach="material-2"
          map={cruces} /*olor="#FFD700"*/
        />
      </mesh>

      {/* Borde frontal */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.055, 0]}>
        <ringGeometry args={[0.85, 1, 64]} />
        <meshStandardMaterial
          color="#333333"
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.055, 0]}>
        <ringGeometry args={[0.85, 1, 64]} />
        <meshStandardMaterial
          color="#333333"
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function App() {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState("Heads");
  const buttonRef = useRef(null);
  const audio = new Audio("/mario_coin_sound.mp3");
  const flipCoin = () => {
    audio.play();
    if (flipping) return;
    setFlipping(true);

    // Heads o Tails aleatorio
    const newResult = Math.random() < 0.5 ? "Heads" : "Tails";
    setResult(newResult);

    // Detener animación después de un tiempo
    setTimeout(() => {
      setFlipping(false);

      // Ajustar rotación final según resultado
      // Heads = arriba (0), Tails = abajo (π)
      console.log("Resultado:", newResult);
    }, 2400);


  };
useEffect(() => {
  const ws = new WebSocket("ws://localhost:4455");

  ws.onopen = () => {
    console.log("✅ Conectado a obs-websocket");
    // Si tu servidor obs-websocket tiene contraseña, aquí tendrías que hacer el handshake de auth
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("📩 Mensaje OBS:", data);

    // Escuchar un CustomEvent que hayas mandado desde Python u OBS
    if (data.op === 5 && data.d.eventType === "CustomEvent") {
      if (data.d.eventData?.action === "pressButton") {
        console.log("🎬 Recibido pressButton -> simulando click");
        buttonRef.current?.click();
      }
    }
  };

  return () => ws.close();
}, []);
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [6, 7, 5], fov: 75 }}>
        <ambientLight intensity={1} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-3, 2, -3]} intensity={2} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
        <Coin result={result} flipping={flipping} />
        <OrbitControls />
      </Canvas>

      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <button ref={buttonRef} onClick={flipCoin} disabled={flipping}>
          {flipping ? "Flipping..." : "Flip Coin"}
        </button>
        <p>Resultado: {result}</p>
      </div>
    </div>
  );
}
