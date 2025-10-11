from fastapi import BackgroundTasks, FastAPI
from fastapi_radar import Radar
from sqlalchemy import Column, Integer, MetaData, String, Table, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

app = FastAPI()
engine = create_async_engine("sqlite+aiosqlite:///./app.db")
async_session: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine, expire_on_commit=False
)

# 定义一个简单的测试表
metadata = MetaData()
users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(50), nullable=False),
)


radar = Radar(app, db_engine=engine)
radar.create_tables()


@app.on_event("startup")
async def on_startup() -> None:
    """应用启动时创建测试表并写入示例数据。"""

    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)

    async with async_session() as session:
        result = await session.execute(select(users_table.c.id).limit(1))
        if result.first() is None:
            await session.execute(
                users_table.insert(),
                [{"name": "Alice"}, {"name": "Bob"}, {"name": "Carol"}],
            )
            await session.commit()


# Your routes work unchanged
@app.get("/users")
async def get_users():
    async with async_session() as session:
        result = await session.execute(select(users_table))
        rows = result.mappings().all()
    import httpx,requests
    res1 = httpx.get("http://www.baidu.com")
    res2 = requests.get("http://www.baidu.com")

    return {"users": [dict(row) for row in rows]}


@app.get("/simulate-task")
async def simulate_task(background_tasks: BackgroundTasks):
    """用于测试的后台任务接口，触发一个简单的后台任务。"""

    def sample_task() -> None:
        # 这里没有实际工作，仅用于验证后台任务监控逻辑
        print("后台任务")

    background_tasks.add_task(sample_task)
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
