/**
 * 空间布局设计师 - 3D初始化脚本
 * Three.js 3D Room Layout Designer
 */

class SpaceLayoutDesigner {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // 房间参数
    this.roomParams = {
      length: 5.0,
      width: 4.0,
      height: 2.8
    };
    
    // 房间对象
    this.room = {
      floor: null,
      walls: [],
      grid: null
    };
    
    // 层板列表
    this.shelves = [];
    this.selectedShelf = null;
    
    // 材质颜色选项
    this.colorOptions = {
      tile: ['#E8E4DE', '#D4C8BC', '#A89888', '#786A5A', '#4A4035', '#2C2419'],
      wood: ['#DEB887', '#D2691E', '#8B4513', '#A0522D', '#CD853F', '#DAA520'],
      shelf: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#FFFFFF', '#2C2419', '#1C1C1C']
    };
    
    this.currentFloorType = 'tile';
    this.isWireframe = false;
    
    this.init();
  }
  
  init() {
    this.initScene();
    this.initLights();
    this.initRoom();
    this.initControls();
    this.initEventListeners();
    this.updateAreaDisplay();
    this.renderColorButtons();
    this.animate();
  }
  
  initScene() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.Fog(0x0f172a, 10, 30);
    
    // 相机
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(8, 6, 8);
    
    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // 窗口大小调整
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  initLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // 主方向光
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -15;
    mainLight.shadow.camera.right = 15;
    mainLight.shadow.camera.top = 15;
    mainLight.shadow.camera.bottom = -15;
    this.scene.add(mainLight);
    
    // 补光
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }
  
  initRoom() {
    this.createFloor();
    this.createWalls();
    this.createGrid();
  }
  
  createFloor() {
    if (this.room.floor) {
      this.scene.remove(this.room.floor);
    }
    
    const geometry = new THREE.PlaneGeometry(this.roomParams.length, this.roomParams.width);
    const material = new THREE.MeshStandardMaterial({
      color: this.colorOptions.tile[0],
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    this.room.floor = new THREE.Mesh(geometry, material);
    this.room.floor.rotation.x = -Math.PI / 2;
    this.room.floor.position.y = 0;
    this.room.floor.receiveShadow = true;
    this.room.floor.name = 'floor';
    this.scene.add(this.room.floor);
  }
  
  createWalls() {
    // 移除旧墙
    this.room.walls.forEach(wall => this.scene.remove(wall));
    this.room.walls = [];
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    
    // 后墙
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomParams.length, this.roomParams.height),
      wallMaterial.clone()
    );
    backWall.position.set(0, this.roomParams.height / 2, -this.roomParams.width / 2);
    backWall.name = 'wall-back';
    this.scene.add(backWall);
    this.room.walls.push(backWall);
    
    // 左墙
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomParams.width, this.roomParams.height),
      wallMaterial.clone()
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-this.roomParams.length / 2, this.roomParams.height / 2, 0);
    leftWall.name = 'wall-left';
    this.scene.add(leftWall);
    this.room.walls.push(leftWall);
  }
  
  createGrid() {
    if (this.room.grid) {
      this.scene.remove(this.room.grid);
    }
    
    const size = Math.max(this.roomParams.length, this.roomParams.width);
    this.room.grid = new THREE.GridHelper(size, size * 2, 0x444444, 0x222222);
    this.room.grid.position.y = 0.01;
    this.scene.add(this.room.grid);
  }
  
  initControls() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.target.set(0, 1, 0);
  }
  
  initEventListeners() {
    // 房间尺寸滑块
    document.getElementById('length')?.addEventListener('input', (e) => {
      this.roomParams.length = parseFloat(e.target.value);
      document.getElementById('length-val').textContent = this.roomParams.length.toFixed(2) + 'm';
      this.updateRoom();
    });
    
    document.getElementById('width')?.addEventListener('input', (e) => {
      this.roomParams.width = parseFloat(e.target.value);
      document.getElementById('width-val').textContent = this.roomParams.width.toFixed(2) + 'm';
      this.updateRoom();
    });
    
    document.getElementById('height')?.addEventListener('input', (e) => {
      this.roomParams.height = parseFloat(e.target.value);
      document.getElementById('height-val').textContent = this.roomParams.height.toFixed(2) + 'm';
      this.updateRoom();
    });
    
    // 地面材质按钮
    document.querySelectorAll('[data-action="set-floor-type"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setFloorType(e.target.dataset.floorType);
      });
    });
    
    // 添加层板按钮
    document.querySelector('[data-action="add-shelf"]')?.addEventListener('click', () => {
      this.showShelfForm();
    });
    
    // 确认添加层板
    document.querySelector('[data-action="confirm-add-shelf"]')?.addEventListener('click', () => {
      this.addShelf();
    });
    
    // 取消添加
    document.querySelector('[data-action="cancel-add-shelf"]')?.addEventListener('click', () => {
      this.hideShelfForm();
    });
    
    // 删除选中层板
    document.querySelector('[data-action="delete-selected-shelf"]')?.addEventListener('click', () => {
      this.deleteSelectedShelf();
    });
    
    // 重置视角
    document.querySelector('[data-action="reset-camera"]')?.addEventListener('click', () => {
      this.resetCamera();
    });
    
    // 线框模式
    document.querySelector('[data-action="toggle-wireframe"]')?.addEventListener('click', () => {
      this.toggleWireframe();
    });
    
    // 清空层板
    document.querySelector('[data-action="clear-all-shelves"]')?.addEventListener('click', () => {
      this.clearAllShelves();
    });
    
    // 编辑层板输入框事件
    document.querySelectorAll('.js-update-selected-shelf').forEach(input => {
      input.addEventListener('input', () => {
        this.updateSelectedShelf();
      });
    });
    
    // 点击选择层板
    const container = document.getElementById('canvas-container');
    container?.addEventListener('click', (e) => this.onCanvasClick(e));
  }
  
  updateRoom() {
    this.createFloor();
    this.createWalls();
    this.createGrid();
    this.updateAreaDisplay();
    this.updateDimensionInfo();
    
    // 更新所有层板位置
    this.shelves.forEach(shelf => {
      this.updateShelfMesh(shelf);
    });
  }
  
  setFloorType(type) {
    this.currentFloorType = type;
    
    // 更新按钮状态
    document.querySelectorAll('[data-action="set-floor-type"]').forEach(btn => {
      btn.classList.remove('tab-active', 'tab-inactive');
      btn.classList.add(btn.dataset.floorType === type ? 'tab-active' : 'tab-inactive');
    });
    
    // 更新地面颜色
    if (this.room.floor) {
      this.room.floor.material.color.set(this.colorOptions[type][0]);
    }
    
    this.renderColorButtons();
  }
  
  renderColorButtons() {
    const container = document.getElementById('floor-colors');
    if (!container) return;
    
    const colors = this.colorOptions[this.currentFloorType] || this.colorOptions.tile;
    container.innerHTML = colors.map((color, i) => `
      <button class="color-btn w-8 h-8 rounded-full border-2 border-slate-600 ${i === 0 ? 'ring-2 ring-blue-400' : ''}"
              style="background-color: ${color}"
              data-color="${color}"
              data-index="${i}"></button>
    `).join('');
    
    // 绑定点击事件
    container.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        if (this.room.floor) {
          this.room.floor.material.color.set(color);
        }
        // 更新选中状态
        container.querySelectorAll('.color-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-400'));
        e.target.classList.add('ring-2', 'ring-blue-400');
      });
    });
  }
  
  showShelfForm() {
    document.getElementById('shelf-form')?.classList.remove('hidden');
    document.getElementById('edit-form')?.classList.add('hidden');
  }
  
  hideShelfForm() {
    document.getElementById('shelf-form')?.classList.add('hidden');
  }
  
  addShelf() {
    const length = parseFloat(document.getElementById('new-length')?.value || 1);
    const depth = parseFloat(document.getElementById('new-depth')?.value || 0.4);
    const thickness = parseFloat(document.getElementById('new-thickness')?.value || 1.8) / 100;
    const height = parseFloat(document.getElementById('new-height')?.value || 0.8);
    const color = document.getElementById('new-color')?.value || '#8B4513';
    const material = document.getElementById('new-material')?.value || 'wood';
    
    const shelf = {
      id: Date.now(),
      length,
      depth,
      thickness,
      height,
      color,
      material,
      mesh: null
    };
    
    this.createShelfMesh(shelf);
    this.shelves.push(shelf);
    this.hideShelfForm();
    this.renderShelfList();
  }
  
  createShelfMesh(shelf) {
    const geometry = new THREE.BoxGeometry(shelf.length, shelf.thickness, shelf.depth);
    const material = new THREE.MeshStandardMaterial({
      color: shelf.color,
      roughness: 0.7,
      metalness: 0.1
    });
    
    shelf.mesh = new THREE.Mesh(geometry, material);
    this.updateShelfMesh(shelf);
    shelf.mesh.castShadow = true;
    shelf.mesh.receiveShadow = true;
    shelf.mesh.userData = { shelfId: shelf.id };
    this.scene.add(shelf.mesh);
  }
  
  updateShelfMesh(shelf) {
    if (!shelf.mesh) return;
    
    // 更新几何体
    shelf.mesh.geometry.dispose();
    shelf.mesh.geometry = new THREE.BoxGeometry(shelf.length, shelf.thickness, shelf.depth);
    
    // 更新位置（在房间范围内居中）
    const x = 0;
    const y = shelf.height + shelf.thickness / 2;
    const z = 0;
    shelf.mesh.position.set(x, y, z);
  }
  
  renderShelfList() {
    const container = document.getElementById('shelf-list');
    if (!container) return;
    
    if (this.shelves.length === 0) {
      container.innerHTML = '<div class="text-xs text-slate-500 text-center py-8 italic">暂无层板，点击上方添加</div>';
      return;
    }
    
    container.innerHTML = this.shelves.map(shelf => `
      <div class="item-card p-3 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer ${this.selectedShelf?.id === shelf.id ? 'border-blue-500' : ''}"
           data-shelf-id="${shelf.id}">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-xs font-medium text-slate-200">层板 #${shelf.id.toString().slice(-4)}</div>
            <div class="text-[10px] text-slate-400 mt-1">
              ${shelf.length}×${shelf.depth}m | 离地 ${shelf.height}m
            </div>
          </div>
          <div class="w-6 h-6 rounded" style="background-color: ${shelf.color}"></div>
        </div>
      </div>
    `).join('');
    
    // 绑定点击事件
    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const shelfId = parseInt(card.dataset.shelfId);
        this.selectShelf(shelfId);
      });
    });
  }
  
  selectShelf(shelfId) {
    // 取消之前的选择
    if (this.selectedShelf) {
      if (this.selectedShelf.mesh) {
        this.selectedShelf.mesh.material.emissive.set(0x000000);
      }
    }
    
    // 选中新层板
    this.selectedShelf = this.shelves.find(s => s.id === shelfId);
    if (this.selectedShelf && this.selectedShelf.mesh) {
      this.selectedShelf.mesh.material.emissive.set(0x333333);
    }
    
    // 显示编辑表单
    if (this.selectedShelf) {
      document.getElementById('edit-form')?.classList.remove('hidden');
      document.getElementById('shelf-form')?.classList.add('hidden');
      
      document.getElementById('edit-id').textContent = this.selectedShelf.id.toString().slice(-4);
      document.getElementById('edit-length').value = this.selectedShelf.length;
      document.getElementById('edit-depth').value = this.selectedShelf.depth;
      document.getElementById('edit-thickness').value = this.selectedShelf.thickness * 100;
      document.getElementById('edit-height').value = this.selectedShelf.height;
      document.getElementById('edit-material').value = this.selectedShelf.material;
      
      // 渲染颜色选项
      this.renderEditColorOptions();
    }
    
    this.renderShelfList();
  }
  
  renderEditColorOptions() {
    const container = document.getElementById('edit-color-options');
    if (!container) return;
    
    const colors = this.colorOptions.shelf;
    container.innerHTML = colors.map(color => `
      <button class="color-btn w-6 h-6 rounded-full border border-slate-600 ${this.selectedShelf?.color === color ? 'ring-2 ring-blue-400' : ''}"
              style="background-color: ${color}"
              data-color="${color}"></button>
    `).join('');
    
    container.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (this.selectedShelf) {
          this.selectedShelf.color = e.target.dataset.color;
          this.selectedShelf.mesh.material.color.set(e.target.dataset.color);
          this.renderEditColorOptions();
          this.renderShelfList();
        }
      });
    });
  }
  
  updateSelectedShelf() {
    if (!this.selectedShelf) return;
    
    this.selectedShelf.length = parseFloat(document.getElementById('edit-length')?.value || 1);
    this.selectedShelf.depth = parseFloat(document.getElementById('edit-depth')?.value || 0.4);
    this.selectedShelf.thickness = parseFloat(document.getElementById('edit-thickness')?.value || 1.8) / 100;
    this.selectedShelf.height = parseFloat(document.getElementById('edit-height')?.value || 0.8);
    this.selectedShelf.material = document.getElementById('edit-material')?.value || 'wood';
    
    this.updateShelfMesh(this.selectedShelf);
    this.renderShelfList();
  }
  
  deleteSelectedShelf() {
    if (!this.selectedShelf) return;
    
    if (this.selectedShelf.mesh) {
      this.scene.remove(this.selectedShelf.mesh);
    }
    
    this.shelves = this.shelves.filter(s => s.id !== this.selectedShelf.id);
    this.selectedShelf = null;
    
    document.getElementById('edit-form')?.classList.add('hidden');
    this.renderShelfList();
  }
  
  clearAllShelves() {
    this.shelves.forEach(shelf => {
      if (shelf.mesh) {
        this.scene.remove(shelf.mesh);
      }
    });
    this.shelves = [];
    this.selectedShelf = null;
    document.getElementById('edit-form')?.classList.add('hidden');
    this.renderShelfList();
  }
  
  resetCamera() {
    this.camera.position.set(8, 6, 8);
    this.controls.target.set(0, 1, 0);
    this.controls.update();
  }
  
  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    
    this.shelves.forEach(shelf => {
      if (shelf.mesh) {
        shelf.mesh.material.wireframe = this.isWireframe;
      }
    });
    
    if (this.room.floor) {
      this.room.floor.material.wireframe = this.isWireframe;
    }
  }
  
  onCanvasClick(event) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const shelfMeshes = this.shelves.map(s => s.mesh).filter(m => m);
    const intersects = this.raycaster.intersectObjects(shelfMeshes);
    
    if (intersects.length > 0) {
      const shelfId = intersects[0].object.userData.shelfId;
      this.selectShelf(shelfId);
    }
  }
  
  updateAreaDisplay() {
    const area = this.roomParams.length * this.roomParams.width;
    document.getElementById('area-display').textContent = area.toFixed(2) + '㎡';
  }
  
  updateDimensionInfo() {
    document.getElementById('dimension-info').textContent = 
      `L:${this.roomParams.length.toFixed(2)} × W:${this.roomParams.width.toFixed(2)} × H:${this.roomParams.height.toFixed(2)}`;
  }
  
  onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls?.update();
    this.renderer?.render(this.scene, this.camera);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 初始化导航
  if (typeof Navigation !== 'undefined' && document.getElementById('navigationContainer')) {
    const nav = new Navigation('navigationContainer', {
      logoText: 'Bits of Life',
      backLinkText: '返回首页',
      homePath: '../index.html'
    });
    nav.render();
  }
  
  // 初始化3D布局设计器
  window.spaceLayoutDesigner = new SpaceLayoutDesigner();
});
