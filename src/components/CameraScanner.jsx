import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Camera } from 'lucide-react'

export default function CameraScanner({ onDetectado, onCerrar }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const lector = new BrowserMultiFormatReader()
    let detectado = false

    lector
      .decodeFromVideoDevice(undefined, videoRef.current, (resultado, err, controls) => {
        controlsRef.current = controls
        if (resultado && !detectado) {
          detectado = true
          controls.stop()
          onDetectado(resultado.getText())
        }
      })
      .catch((err) => {
        console.error(err)
        setError(
          'No se pudo acceder a la cámara. Revisa que le hayas dado permiso al navegador para usarla.'
        )
      })

    return () => {
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
            Apunta la cámara al código de barras del producto — se detecta solo.
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
