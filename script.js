const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false }); // Matikan log untuk UI bersih

async function loadAndClip() {
    const url = document.getElementById('videoUrl').value.trim();
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('errorMsg');
    const videoPlayer = document.getElementById('videoPlayer');
    const downloadLink = document.getElementById('downloadLink');

    // Reset UI
    loading.style.display = 'none';
    errorMsg.style.display = 'none';
    videoPlayer.style.display = 'none';
    downloadLink.style.display = 'none';

    if (!url) {
        errorMsg.textContent = 'Masukkan link video yang valid!';
        errorMsg.style.display = 'block';
        return;
    }

    loading.style.display = 'block';

    try {
        // Muat FFmpeg jika belum
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        // Fetch video dengan error handling
        const videoResponse = await fetch(url);
        if (!videoResponse.ok) {
            throw new Error('Gagal mengambil video. Periksa link atau CORS.');
        }
        const videoBlob = await videoResponse.blob();
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoBlob));

        // Potong video menjadi 1 menit pertama
        await ffmpeg.run('-i', 'input.mp4', '-t', '60', '-c', 'copy', 'output.mp4');

        // Baca hasil
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const urlBlob = URL.createObjectURL(blob);

        // Tampilkan hasil
        videoPlayer.src = urlBlob;
        videoPlayer.style.display = 'block';
        downloadLink.href = urlBlob;
        downloadLink.style.display = 'inline-block';

    } catch (error) {
        errorMsg.textContent = 'Error: ' + error.message;
        errorMsg.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}
