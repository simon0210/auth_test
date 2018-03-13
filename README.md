## SK 블록체인 협의체 본인인증 SDK 테스트 환경
#### prerequisite
node 6.x 버전 사용
```
$)git clone http://169.56.90.134:3000/kim-sk/skbc-auth-sdk-test.git
$)cd skbc-auth-sdk-test
$)npm install
$)npm run compile
```

#### BootStrap Hyperledger Fabric 1.0.2 도커 이미지
```
$)cd tools
$)./bootstrap-1.0.2.sh
```

#### ELK 실행
```
$)cd monitor
$)docker-compose up -d 
```
키바나 (최초 실행시 몇분 딜레이 있음 - FIX ME)
* [http://localhost:5601](http://localhost:5601)

인덱스 조회 및 삭제
```
curl -XGET 'localhost:9200/_cat/indices?v&pretty'

curl -XDELETE 'localhost:9200/logstash-2017.09.27?pretty&pretty'
```

#### Hyperledger Fabric 1.0.2 테스트 네트워크 실행
```
$)cd tools
$)./4-node.sh
$)./4-node-setup.sh
```

##### Run in *development* mode:

```
npm run dev
```

##### Run in *process* mode:

```
$)cd build 
$)node main.js
```
##### Jmeter 실행:

```
$)cd test/jmeter/bin
$)./jmeter.sh
```

Jmeter 실행후 test/jmeter 폴더의 SKBC-Create-Cert-Stress-Test.jmx, SKBC-Query-Cert-Stress-Test.jmx 임포트 후 사용


#### API 브라우저
* [http://localhost:3000](http://localhost:3000)