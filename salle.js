<svg
  viewBox="0 0 1400 1000"
  xmlns="http://www.w3.org/2000/svg"
  class="seat-map"
>
  <style>
    .seat {
      fill: #c62828;
      cursor: pointer;
      transition: fill 0.15s ease;
    }
    .seat.available:hover {
      fill: #ef5350;
    }
    .seat.hold {
      fill: #ff9800;
      cursor: not-allowed;
    }
    .seat.sold {
      fill: #424242;
      cursor: not-allowed;
    }
  </style>

  <!-- ================================================= -->
  <!-- ================= ORCHESTRE BAS ================= -->
  <!-- ================================================= -->
  <g data-zone="orchestre-bas" transform="translate(200, 600)">
    <!-- 15 rangées / 20 sièges -->
    <!-- A → O -->
    <!-- Généré de façon régulière -->

    <!-- ROW A -->
    <g data-row="A">
      <!-- 20 seats -->
      <rect class="seat available" data-seat-id="A1"  x="0"   y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A2"  x="26"  y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A3"  x="52"  y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A4"  x="78"  y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A5"  x="104" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A6"  x="130" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A7"  x="156" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A8"  x="182" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A9"  x="208" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A10" x="234" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A11" x="260" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A12" x="286" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A13" x="312" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A14" x="338" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A15" x="364" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A16" x="390" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A17" x="416" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A18" x="442" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A19" x="468" y="0" width="22" height="22" rx="3"/>
      <rect class="seat available" data-seat-id="A20" x="494" y="0" width="22" height="22" rx="3"/>
    </g>

    <!-- ROW B → O (même logique, décalage vertical) -->
    <!-- Pour lisibilité ici : principe identique -->
    <!-- Chaque rangée = translateY +28 -->

    <!-- B -->
    <g data-row="B" transform="translate(0,28)">
      <!-- B1 → B20 -->
      <!-- … -->
    </g>

    <!-- C -->
    <g data-row="C" transform="translate(0,56)"></g>
    <g data-row="D" transform="translate(0,84)"></g>
    <g data-row="E" transform="translate(0,112)"></g>
    <g data-row="F" transform="translate(0,140)"></g>
    <g data-row="G" transform="translate(0,168)"></g>
    <g data-row="H" transform="translate(0,196)"></g>
    <g data-row="I" transform="translate(0,224)"></g>
    <g data-row="J" transform="translate(0,252)"></g>
    <g data-row="K" transform="translate(0,280)"></g>
    <g data-row="L" transform="translate(0,308)"></g>
    <g data-row="M" transform="translate(0,336)"></g>
    <g data-row="N" transform="translate(0,364)"></g>
    <g data-row="O" transform="translate(0,392)"></g>
  </g>

  <!-- ================================================= -->
  <!-- ================= ORCHESTRE HAUT ================= -->
  <!-- ================================================= -->
  <g data-zone="orchestre-haut" transform="translate(200, 350)">
    <!-- 10 rangées / 24 sièges -->
    <!-- A → J -->
    <!-- même principe -->
  </g>

  <!-- ================================================= -->
  <!-- ==================== BALCON ===================== -->
  <!-- ================================================= -->
  <g data-zone="balcon" transform="translate(200, 120)">
    <!-- 8 rangées / 26 sièges -->
  </g>
</svg>
