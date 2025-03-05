<script lang="ts">
    import type { Card } from "$lib/gameStore";
    export let card: Card; // 🔹 Keep this to accept a card prop
  </script>
  
  <div class="card">
    <p>{card.effect || card.type} {card.value ? `(${card.value} km)` : ""}</p>
  </div>
  
  <style>
    .card {
      border: 2px solid black;
      padding: 10px;
      border-radius: 5px;
      width: 80px;
      text-align: center;
      font-weight: bold;
    }
  </style>
  