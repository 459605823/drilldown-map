# drilldown-map

> 中国各省市任意下钻的3D地图

#### 项目代码初始化

- 方式一：`npx degit 459605823/drilldown-map {project-name} --mode=git`

- 方式二： 新建项目开发，复制vis文件夹和public中的geojson数据到新项目中，安装@q/pencil、three等依赖

#### 开发

- 该项目基于`generator`模版项目生成，主要代码在vis文件夹中。
- geojson数据在public/static中，爬取的最新[阿里云数据](http://datav.aliyun.com/portal/school/atlas/area_selector)
- 如果是开发插件，需要修改package.json中`name`为`@q/vis-xxx`和`version`版本号，通过`build:vis`命令打包后，使用`pub`命令发布包，还需要将geojson数据提供给插件使用者并放到对应的目录下。

##### 核心文件

- vis/index.ts: 业务组件，包含整体场景的初始化和元素的绘制以及交互逻辑。
- vis/objects/map/PlaneMap.ts: 每一级地图都通过对应的geojson数据和PlaneMap组件来生成，该组件包含当前地图的子板块信息以及交互逻辑。生成新的地图要和上一级地图使用同样的`projection`投影才能生成到对应的位置上。
- vis/objects/map/Area.ts: 用于生成单个板块，包含边界线`line`和顶面侧面`mesh`, 同时该组件的`userData`中保存了该区域geojson中的信息。每一级地图都是由多个`Area`组成，单个板块的交互逻辑可以在该组件中实现。
- vis/objects/map/commonMaterial.ts: 该文件包含地图顶面、侧面和边界线的公共材质，为了提升性能，地图中的板块共用相同的材质，所以如果要修改某个板块的材质，如颜色，不要直接修改材质的颜色，可以通过`material.clone()`创建一个新的材质修改后再替换之前的材质。如果在`commonMaterial.ts`中修改材质不生效，请查看`PlaneMap.ts`中是否有调用`setGuiTargetValueByParams`，该方法会根据`guiParams`中的配置来设置材质属性。
- vis/objects/light/config.ts: 该文件为场景中灯光的配置，如类型、颜色、位置和强度等，光对整个场景的颜色效果影响很大，修改样式时要注意修改灯光配置。

##### 下钻
下钻的逻辑在`vis/index.ts`中，主要通过`handleDrillDown`和`setAdcode`这两个函数来实现，当触发下钻时通过调用`setAdcode`并传入对应的`adcodes`，该函数会将当前组件内部的`adcodes`与传入的`adcodes`进行对比，之后调用`handleDrillDown`函数，该函数会根据传入的`adcode`去找到对应的区域，根据其`userData`中保存的信息去请求该区域的geojson文件，然后创建新的`PlaneMap`组件，根据新的地图的大小和中心位置去移动摄像机和控制器的位置，之后更新`map`属性为当前`PlaneMap`组件，保证之后的交互在新的地图上进行，这样就完成了下钻。
> 1. 注意目前`setAdcode`函数实现仅可下钻到市，下钻到市时`adcodes`也要包含对应的省`[省、市]`
> 2. 返回到全国时传入空数组`[]`

业务组件的`adcodes`属性保存每一级地图的区域代码，为了避免重复触发事件，`setAdcode`函数要由外部来调用，当内部触发下钻，如点击地图板块时，会根据要下钻区域的`adcode`和当前`adcodes`属性生成新的`adcodes`并通过`adcodes`事件传到外部，外部监听该事件并修改其保存的`adcodes`，同时监听`adcodes`变化，当变化时调用`setAdcode`函数进行下钻。
每次地图变化时，都会更新`mapHistory`属性，其包含每一级地图的`PlaneMap`组件以及摄像机和控制器的位置。