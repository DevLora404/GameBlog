// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBy9gvm23tOTvq125CmYS7p2davtyQvpxxw",
  authDomain: "devlog-comments.firebaseapp.com",
  projectId: "devlog-comments",
  storageBucket: "devlog-comments.appspot.com",
  messagingSenderId: "1035235621642",
  appId: "1:1035235621642:web:dbc3396e77492e167c58f3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Renderizar un comentario
function renderComment(doc) {
  const data = doc.data();
  const commentElement = document.createElement('div');
  commentElement.classList.add('comment');

  const author = document.createElement('strong');
  author.textContent = data.name || "Anonymous";
  commentElement.appendChild(author);

  const text = document.createElement('p');
  text.textContent = data.text;
  commentElement.appendChild(text);

  if (data.imageDataUrl) {
    const image = document.createElement('img');
    image.src = data.imageDataUrl;
    image.style.maxWidth = "200px";
    commentElement.appendChild(image);
  }

  // Mostrar botón de borrar solo si el comentario fue creado desde este navegador
  const myComments = JSON.parse(localStorage.getItem('myComments') || '[]');
  if (myComments.includes(doc.id)) {
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.classList.add('delete-comment');
    delBtn.onclick = () => {
      db.collection('comments').doc(doc.id).delete().then(loadComments);
    };
    commentElement.appendChild(delBtn);
  }

  document.getElementById('comments-list').prepend(commentElement);
}

// Cargar comentarios
function loadComments() {
  const container = document.getElementById('comments-list');
  container.innerHTML = '';
  db.collection('comments')
    .orderBy('timestamp', 'desc')
    .get()
    .then(snapshot => snapshot.forEach(renderComment));
}

// Guardar nuevo comentario
document.getElementById('comment-form').addEventListener('submit', async function (event) {
  event.preventDefault();

  const name = document.getElementById('name').value.trim() || 'Anonymous';
  const text = document.getElementById('comment').value.trim();
  const imageInput = document.getElementById('image');
  const imageFile = imageInput.files[0];

  if (!text) return;

  let imageDataUrl = null;

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      imageDataUrl = e.target.result;
      await saveComment({ name, text, imageDataUrl });
      document.getElementById('comment-form').reset();
    };
    reader.readAsDataURL(imageFile);
  } else {
    await saveComment({ name, text, imageDataUrl });
    document.getElementById('comment-form').reset();
  }
});

// Guardar comentario y registrar su ID localmente
async function saveComment(commentData) {
  commentData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
  const docRef = await db.collection("comments").add(commentData);

  // Guardar ID en localStorage
  let myComments = JSON.parse(localStorage.getItem('myComments') || '[]');
  myComments.push(docRef.id);
  localStorage.setItem('myComments', JSON.stringify(myComments));

  loadComments();
}

// Cargar comentarios al iniciar
document.addEventListener("DOMContentLoaded", loadComments);
