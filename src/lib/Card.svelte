<script lang="ts">
    export let card: { type: string; value: number };
  </script>
  
  <div class="card">
    <p>{card.type}</p>
    <p>{card.value}</p>
  </div>
  
  <style>
    .card {
      width: 100px;
      height: 150px;
      border: 2px solid black;
      border-radius: 8px;
      text-align: center;
      padding: 10px;
      background-color: white;
    }
  </style>
  