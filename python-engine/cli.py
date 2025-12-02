#!/usr/bin/env python3
"""
CLI Wrapper para transcriptor-lib
Permite llamar desde Tauri/Node via subprocess
"""

import sys
import json
import os
import subprocess
import tempfile
from pathlib import Path

# Añadir transcriptor-lib al path
sys.path.insert(0, str(Path(__file__).parent / "transcriptor-lib"))

from transcriptor import Transcriptor


def main():
    """
    CLI para transcripción de audio/video

    Uso:
        python cli.py transcribe <archivo> [opciones]
        python cli.py test_api <api_key>

    Salida: JSON a stdout
    """

    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Uso: cli.py <comando> [args]'
        }))
        sys.exit(1)

    comando = sys.argv[1]

    try:
        if comando == 'transcribe':
            transcribe_command()
        elif comando == 'youtube':
            youtube_command()
        elif comando == 'test_api':
            test_api_command()
        else:
            print(json.dumps({
                'success': False,
                'error': f'Comando desconocido: {comando}'
            }))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'type': type(e).__name__
        }))
        sys.exit(1)


def transcribe_command():
    """
    Transcribe un archivo de audio/video

    Args esperados (JSON via stdin o args):
        - file_path: str
        - api_key: str
        - language: str (default: 'es')
        - model: str (default: 'whisper-large-v3-turbo')
        - prompt: str (opcional)
    """

    # Priorizar argumentos si están disponibles (para compatibilidad con Node.js spawn)
    if len(sys.argv) >= 4:
        # Modo argumentos
        config = {
            'file_path': sys.argv[2],
            'api_key': sys.argv[3],
            'language': sys.argv[4] if len(sys.argv) > 4 else 'es',
            'model': sys.argv[5] if len(sys.argv) > 5 else 'whisper-large-v3-turbo',
            'prompt': sys.argv[6] if len(sys.argv) > 6 else ''
        }
    elif not sys.stdin.isatty():
        # Modo JSON desde stdin
        config = json.load(sys.stdin)
    else:
        raise ValueError("Uso: cli.py transcribe <archivo> <api_key> [language] [model]")

    # Validar archivo
    file_path = Path(config['file_path'])
    if not file_path.exists():
        raise FileNotFoundError(f"Archivo no encontrado: {file_path}")

    # Crear transcriptor
    trans = Transcriptor(
        api_key=config['api_key'],
        default_model=config.get('model', 'whisper-large-v3-turbo')
    )

    # Transcribir
    resultado = trans.transcribir(
        str(file_path),
        language=config.get('language', 'es'),
        prompt=config.get('prompt', ''),
        format='json'
    )

    # Añadir metadata adicional
    resultado['file_name'] = file_path.name
    resultado['file_size_mb'] = file_path.stat().st_size / (1024 * 1024)

    # Retornar JSON
    print(json.dumps(resultado, ensure_ascii=False, indent=2))


def youtube_command():
    """
    Descarga audio de YouTube y transcribe

    Args esperados:
        - youtube_url: str (sys.argv[2])
        - api_key: str (sys.argv[3])
        - language: str (default: 'es') (sys.argv[4])
        - model: str (default: 'whisper-large-v3-turbo') (sys.argv[5])
    """
    if len(sys.argv) < 4:
        raise ValueError("Uso: cli.py youtube <url> <api_key> [language] [model]")

    youtube_url = sys.argv[2]
    api_key = sys.argv[3]
    language = sys.argv[4] if len(sys.argv) > 4 else 'es'
    model = sys.argv[5] if len(sys.argv) > 5 else 'whisper-large-v3-turbo'

    # Crear directorio temporal
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        output_template = str(temp_path / '%(title)s.%(ext)s')

        # Descargar audio con yt-dlp
        try:
            cmd = [
                'yt-dlp',
                '-x',  # Extraer solo audio
                '--audio-format', 'mp3',  # Convertir a MP3
                '--audio-quality', '0',  # Mejor calidad
                '-o', output_template,
                youtube_url
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

        except subprocess.CalledProcessError as e:
            raise Exception(f"Error descargando YouTube: {e.stderr}")
        except FileNotFoundError:
            raise Exception("yt-dlp no está instalado. Instalar con: brew install yt-dlp")

        # Buscar el archivo descargado
        audio_files = list(temp_path.glob('*.mp3'))
        if not audio_files:
            raise Exception("No se pudo descargar el audio de YouTube")

        audio_file = audio_files[0]

        # Transcribir el audio
        trans = Transcriptor(
            api_key=api_key,
            default_model=model
        )

        resultado = trans.transcribir(
            str(audio_file),
            language=language,
            prompt='',
            format='json'
        )

        # Añadir metadata adicional
        resultado['file_name'] = audio_file.name
        resultado['file_size_mb'] = audio_file.stat().st_size / (1024 * 1024)
        resultado['source'] = 'youtube'
        resultado['youtube_url'] = youtube_url

        # Retornar JSON
        print(json.dumps(resultado, ensure_ascii=False, indent=2))


def test_api_command():
    """
    Prueba que la API key funcione

    Args:
        - api_key (sys.argv[2])
    """
    if len(sys.argv) < 3:
        raise ValueError("Uso: cli.py test_api <api_key>")

    api_key = sys.argv[2]

    try:
        # Intentar crear instancia
        trans = Transcriptor(api_key=api_key)

        print(json.dumps({
            'success': True,
            'message': 'API key válida',
            'api_key_prefix': api_key[:10] + '...'
        }))

    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
