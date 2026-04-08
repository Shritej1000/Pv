import './styles/main.css'
import { supabase } from './lib/supabase'

let selectedType = 'Complaint';
let activeFilter = 'all';
let votes = JSON.parse(localStorage.getItem('user_votes') || '{}');
let posts = [];

// DOM Elements
const postsFeed = document.getElementById('postsFeed');
const feedTitle = document.getElementById('feedTitle');
const totalCount = document.getElementById('totalCount');
const complaintCount = document.getElementById('complaintCount');
const suggestionCount = document.getElementById('suggestionCount');
const appreciationCount = document.getElementById('appreciationCount');
const searchInput = document.getElementById('searchInput');
const constFilterSelect = document.getElementById('constFilter');
const scrollToFormBtn = document.getElementById('scrollToForm');
const postForm = document.getElementById('post-form');
const submitBtn = document.getElementById('submitBtn');
const typePills = document.querySelectorAll('.type-pill');
const filterChips = document.querySelectorAll('.filter-chip');

// Initialize
async function init() {
  await fetchPosts();
  setupEventListeners();
}

// Fetch posts from Supabase
async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  posts = data || [];
  updateStats();
  renderPosts();
}

function updateStats() {
  totalCount.textContent = posts.length;
  complaintCount.textContent = posts.filter(p => p.type === 'Complaint').length;
  suggestionCount.textContent = posts.filter(p => p.type === 'Suggestion').length;
  appreciationCount.textContent = posts.filter(p => p.type === 'Appreciation').length;
}

function renderPosts() {
  const constFilter = constFilterSelect.value;
  const search = searchInput.value.toLowerCase();
  
  let filtered = posts.filter(p => {
    const matchesFilter = activeFilter === 'all' || p.type === activeFilter;
    const matchesConst = constFilter === 'all' || p.constituency === constFilter;
    const matchesSearch = !search || 
      p.subject.toLowerCase().includes(search) || 
      p.body.toLowerCase().includes(search) || 
      p.name.toLowerCase().includes(search);
    
    return matchesFilter && matchesConst && matchesSearch;
  });

  feedTitle.textContent = filtered.length === 0 ? 'No posts found' : (activeFilter === 'all' ? 'Public Record' : activeFilter + 's');
  
  if (filtered.length === 0) {
    postsFeed.innerHTML = '<div class="empty-state">No posts match your current filter.</div>';
    return;
  }

  postsFeed.innerHTML = filtered.map(p => {
    const tagClass = 'tag-' + p.type.toLowerCase();
    const isVoted = votes[p.id];
    const voteCount = (p.upvotes || 0) + (isVoted ? 1 : 0);
    
    return `
      <div class="post-card">
        <div class="post-card-header">
          <span class="post-type-tag ${tagClass}">${p.type}</span>
          <div class="post-meta">${new Date(p.created_at).toLocaleDateString()}<br>${p.constituency}</div>
        </div>
        <div class="post-name">${p.subject}</div>
        <div class="post-body">${p.body}</div>
        <div class="post-footer">
          <button class="vote-btn ${isVoted ? 'voted' : ''}" data-id="${p.id}">
            <span class="vote-icon">${isVoted ? '▲' : '△'}</span> <span>${voteCount}</span>
          </button>
          <span class="constituency-tag">— ${p.name || 'Anonymous'}</span>
        </div>
      </div>`;
  }).join('');

  // Re-attach vote listeners
  document.querySelectorAll('.vote-btn').forEach(btn => {
    btn.onclick = () => toggleVote(btn.dataset.id);
  });
}

function toggleVote(id) {
  votes[id] = !votes[id];
  localStorage.setItem('user_votes', JSON.stringify(votes));
  renderPosts();
  // Here you would also update the vote in Supabase if needed, 
  // but for now, we'll keep it local like the prototype.
}

async function submitPost() {
  const subject = document.getElementById('inputSubject').value.trim();
  const message = document.getElementById('inputMessage').value.trim();
  const name = document.getElementById('inputName').value.trim() || 'Anonymous';
  const constituency = document.getElementById('inputConst').value;

  if (!subject || !message) {
    showToast('Please fill in subject and message');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const { error } = await supabase
    .from('posts')
    .insert([{
      type: selectedType,
      name,
      constituency,
      subject,
      body: message,
      upvotes: 0
    }]);

  if (error) {
    console.error('Error submitting post:', error);
    showToast(`Error: ${error.message || 'Unknown error'}`);
  } else {
    document.getElementById('inputName').value = '';
    document.getElementById('inputSubject').value = '';
    document.getElementById('inputMessage').value = '';
    showToast('Post submitted to the public record');
    await fetchPosts();
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit post →';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function setupEventListeners() {
  scrollToFormBtn.onclick = () => postForm.scrollIntoView({ behavior: 'smooth' });
  
  typePills.forEach(pill => {
    pill.onclick = () => {
      typePills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      selectedType = pill.dataset.type;
    };
  });

  filterChips.forEach(chip => {
    chip.onclick = () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderPosts();
    };
  });

  constFilterSelect.onchange = renderPosts;
  searchInput.oninput = renderPosts;
  submitBtn.onclick = submitPost;
}

init();
