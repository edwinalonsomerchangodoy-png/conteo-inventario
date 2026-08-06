import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import { X, Camera } from 'lucide-react'

function crearLector() {
  const hints = new Map()
  hints.set(DecodeHintType.TRY_HARDER, true)
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
  ])
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 })
}

const CONSTRAINTS_PREFERIDAS = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    // Ayuda a enfocar de cerca en celulares que lo soportan.
    advanced: [{ focusMode: 'continuous' }],
  },
}

export default function CameraScanner({ onDetectado, onCerrar }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const lector = crearLector()
    let detectado = false
    let cancelado = false

    const manejarResultado = (resultado, err, controls) => {
      controlsRef.current = controls
      if (resultado && !detectado) {
        detectado = true
        controls.stop()
        onDetectado(resultado.getText())
      }
    }

    // Se intenta primero con restricciones específicas (cámara trasera, alta
    // resolución) para leer mejor códigos pequeños o en ángulo. Si el
    // navegador no lo soporta, se cae al modo genérico.
    lector
      .decodeFromConstraints(CONSTRAINTS_PREFERIDAS, videoRef.current, manejarResultado)
      .catch((err) => {
        if (cancelado) return
        console.warn('No se pudo usar la cámara trasera con alta resolución, probando modo genérico', err)
        lector
          .decodeFromVideoDevice(undefined, videoRef.current, manejarResultado)
          .catch((err2) => {
            console.error(err2)
            setError(
              'No se pudo acceder a la cámara. Revisa que le hayas dado permiso al navegador para usarla.'
            )
          })
      })

    return () => {
      cancelado = true
      controlsRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <p className="text-paper text-sm font-medium flex items-center gap-2">
            <Camera size={16} className="text-signal" /> Escanea el código de barras
          </p>
          <button onClick={onCerrar} className="text-paper/70 hover:text-paper transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="scan-frame is-active rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-auto" muted playsInline />
        </div>

        {error ? (
          <p className="text-bad text-sm mt-3 bg-white rounded-lg p-3">{error}</p>
        ) : (
          <p className="text-paper/60 text-xs mt-3 text-center">
            Acerca bien el código y mantén el celular firme — se detecta solo. Si no lee, aléjate
            un poco hasta que el código completo quepa en el recuadro.
          </p>
        )}

        <button
          onClick={onCerrar}
          className="mt-4 w-full bg-white/10 text-paper py-2.5 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
